using InsuranceClaims.Application.Exceptions;
using InsuranceClaims.Application.Interfaces;
using InsuranceClaims.Application.DTOs;
using InsuranceClaims.Domain.Entities;
using InsuranceClaims.Domain.Enums;
using InsuranceClaims.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace InsuranceClaims.Infrastructure.Repositories;

public sealed class ClaimRepository(InsuranceClaimsDbContext context) : IClaimRepository
{
    public async Task<IReadOnlyList<Claim>> GetPagedAsync(ClaimFilterRequest request, CancellationToken cancellationToken) =>
        await ApplyFilters(context.Claims.AsNoTracking(), request)
            .Include(x => x.ClaimType)
            .OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

    public Task<int> CountAsync(ClaimFilterRequest request, CancellationToken cancellationToken) =>
        ApplyFilters(context.Claims.AsNoTracking(), request).CountAsync(cancellationToken);

    public async Task<ClaimDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken)
    {
        var activeClaims = context.Claims
            .AsNoTracking()
            .Where(x => x.DeletedAt == null);

        var statusSummaries = (await activeClaims
            .GroupBy(x => x.Status)
            .Select(group => new
            {
                Status = group.Key,
                Count = group.Count(),
                EstimatedAmount = group.Sum(x => x.EstimatedAmount)
            })
            .ToListAsync(cancellationToken))
            .Select(x => new ClaimStatusSummaryResponse(x.Status, x.Count, x.EstimatedAmount))
            .ToList();

        var totalClaims = statusSummaries.Sum(x => x.Count);
        var totalEstimatedAmount = statusSummaries.Sum(x => x.EstimatedAmount);
        var averageEstimatedAmount = totalClaims == 0
            ? 0
            : decimal.Round(totalEstimatedAmount / totalClaims, 2);

        var claimsByType = (await activeClaims
            .GroupBy(x => x.ClaimType!.Name)
            .Select(group => new
            {
                ClaimType = group.Key,
                Count = group.Count(),
                EstimatedAmount = group.Sum(x => x.EstimatedAmount)
            })
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.ClaimType)
            .Take(8)
            .ToListAsync(cancellationToken))
            .Select(x => new ClaimTypeSummaryResponse(x.ClaimType, x.Count, x.EstimatedAmount))
            .ToList();

        var claimsByMonth = (await activeClaims
            .GroupBy(x => new { x.OccurrenceDate.Year, x.OccurrenceDate.Month })
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                Count = group.Count(),
                EstimatedAmount = group.Sum(x => x.EstimatedAmount)
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToListAsync(cancellationToken))
            .Select(x => new ClaimMonthlySummaryResponse(x.Year, x.Month, x.Count, x.EstimatedAmount))
            .ToList();

        var recentClaims = await activeClaims
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.OccurrenceDate)
            .Take(5)
            .Select(x => new RecentClaimResponse(
                x.Id,
                x.ClaimNumber,
                x.InsuredName,
                x.ClaimTypeId,
                x.ClaimType!.Name,
                x.Status,
                x.OccurrenceDate,
                x.EstimatedAmount))
            .ToListAsync(cancellationToken);

        return new ClaimDashboardResponse(
            totalClaims,
            CountStatus(statusSummaries, ClaimStatus.Open),
            CountStatus(statusSummaries, ClaimStatus.UnderAnalysis),
            CountStatus(statusSummaries, ClaimStatus.Approved),
            CountStatus(statusSummaries, ClaimStatus.Rejected),
            CountStatus(statusSummaries, ClaimStatus.Closed),
            totalEstimatedAmount,
            averageEstimatedAmount,
            statusSummaries.OrderBy(x => x.Status).ToList(),
            claimsByType,
            claimsByMonth,
            recentClaims);
    }

    public Task<Claim?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        context.Claims
            .AsNoTracking()
            .Include(x => x.ClaimType)
            .SingleOrDefaultAsync(x => x.Id == id && x.DeletedAt == null, cancellationToken);

    public Task<Claim?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken) =>
        context.Claims.SingleOrDefaultAsync(x => x.Id == id && x.DeletedAt == null, cancellationToken);

    public Task<bool> ClaimNumberExistsAsync(string claimNumber, Guid? excludedId, CancellationToken cancellationToken) =>
        context.Claims.AnyAsync(x => x.DeletedAt == null &&
            x.ClaimNumber == claimNumber &&
            (!excludedId.HasValue || x.Id != excludedId.Value), cancellationToken);

    public async Task AddAsync(Claim claim, CancellationToken cancellationToken)
    {
        context.Claims.Add(claim);
        await SaveAsync(cancellationToken);
        await LoadClaimTypeAsync(claim, cancellationToken);
    }

    public async Task UpdateAsync(Claim claim, CancellationToken cancellationToken)
    {
        EnsureTracked(claim);
        await SaveAsync(cancellationToken);
        await LoadClaimTypeAsync(claim, cancellationToken);
    }

    public async Task DeleteAsync(Claim claim, CancellationToken cancellationToken)
    {
        EnsureTracked(claim);
        claim.DeletedAt = DateTime.UtcNow;
        await SaveAsync(cancellationToken);
    }

    private void EnsureTracked(Claim claim)
    {
        if (context.Entry(claim).State == EntityState.Detached)
            throw new InvalidOperationException("O sinistro deve ser obtido por GetByIdForUpdateAsync antes de ser alterado.");
    }

    private Task LoadClaimTypeAsync(Claim claim, CancellationToken cancellationToken) =>
        context.Entry(claim).Reference(x => x.ClaimType).LoadAsync(cancellationToken);

    private async Task SaveAsync(CancellationToken cancellationToken)
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            throw new DuplicateClaimNumberException();
        }
    }

    private static IQueryable<Claim> ApplyFilters(IQueryable<Claim> query, ClaimFilterRequest request)
    {
        query = query.Where(x => x.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim();
            var normalizedDocumentSearch = new string(searchTerm
                .Where(char.IsLetterOrDigit)
                .ToArray())
                .ToUpperInvariant();

            query = query.Where(x =>
                x.ClaimNumber.Contains(searchTerm) ||
                x.PolicyNumber.Contains(searchTerm) ||
                x.InsuredName.Contains(searchTerm) ||
                x.InsuredDocument.Contains(searchTerm) ||
                (!string.IsNullOrEmpty(normalizedDocumentSearch) &&
                    x.InsuredDocument.Contains(normalizedDocumentSearch)));
        }

        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.ClaimType))
            query = query.Where(x => x.ClaimType != null && x.ClaimType.Name.Contains(request.ClaimType.Trim()));

        if (request.OccurrenceDateFrom.HasValue)
            query = query.Where(x => x.OccurrenceDate >= request.OccurrenceDateFrom.Value.Date);

        if (request.OccurrenceDateTo.HasValue)
            query = query.Where(x => x.OccurrenceDate <= request.OccurrenceDateTo.Value.Date);

        if (request.EstimatedAmountMin.HasValue)
            query = query.Where(x => x.EstimatedAmount >= request.EstimatedAmountMin.Value);

        if (request.EstimatedAmountMax.HasValue)
            query = query.Where(x => x.EstimatedAmount <= request.EstimatedAmountMax.Value);

        return query;
    }

    private static int CountStatus(IEnumerable<ClaimStatusSummaryResponse> summaries, ClaimStatus status) =>
        summaries.FirstOrDefault(x => x.Status == status)?.Count ?? 0;
}
