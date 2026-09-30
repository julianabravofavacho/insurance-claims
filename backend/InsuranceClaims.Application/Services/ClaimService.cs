using System.ComponentModel.DataAnnotations;
using InsuranceClaims.Application.DTOs;
using InsuranceClaims.Application.Exceptions;
using InsuranceClaims.Application.Interfaces;
using InsuranceClaims.Domain.Entities;
using InsuranceClaims.Domain.Enums;

namespace InsuranceClaims.Application.Services;

public sealed class ClaimService(IClaimRepository repository, IClaimTypeRepository claimTypeRepository) : IClaimService
{
    private const int MaxPageSize = 50;

    public async Task<PagedResult<ClaimResponse>> GetAllAsync(ClaimFilterRequest request, CancellationToken cancellationToken)
    {
        var normalizedRequest = NormalizeFilter(request);
        var totalCount = await repository.CountAsync(normalizedRequest, cancellationToken);
        var normalizedPageNumber = normalizedRequest.PageNumber;
        var normalizedPageSize = normalizedRequest.PageSize;
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);

        if (totalPages > 0 && normalizedPageNumber > totalPages)
            normalizedPageNumber = totalPages;

        normalizedRequest.PageNumber = normalizedPageNumber;
        var claims = await repository.GetPagedAsync(normalizedRequest, cancellationToken);
        return new PagedResult<ClaimResponse>(
            claims.Select(ToResponse).ToList(),
            normalizedPageNumber,
            normalizedPageSize,
            totalCount,
            totalPages);
    }

    public Task<ClaimDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken) =>
        repository.GetDashboardAsync(cancellationToken);

    private static ClaimFilterRequest NormalizeFilter(ClaimFilterRequest request) => new()
    {
        PageNumber = Math.Max(request.PageNumber, 1),
        PageSize = Math.Clamp(request.PageSize, 1, MaxPageSize),
        SearchTerm = string.IsNullOrWhiteSpace(request.SearchTerm) ? null : request.SearchTerm.Trim(),
        Status = request.Status,
        ClaimType = string.IsNullOrWhiteSpace(request.ClaimType) ? null : request.ClaimType.Trim(),
        OccurrenceDateFrom = request.OccurrenceDateFrom?.Date,
        OccurrenceDateTo = request.OccurrenceDateTo?.Date,
        EstimatedAmountMin = request.EstimatedAmountMin,
        EstimatedAmountMax = request.EstimatedAmountMax
    };

    public async Task<ClaimResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var claim = await repository.GetByIdAsync(id, cancellationToken);
        return claim is null ? null : ToResponse(claim);
    }

    public async Task<ClaimResponse> CreateAsync(CreateClaimRequest request, CancellationToken cancellationToken)
    {
        Validator.ValidateObject(request, new ValidationContext(request), validateAllProperties: true);
        await EnsureUniqueNumberAsync(request.ClaimNumber.Trim(), null, cancellationToken);
        await EnsureActiveClaimTypeAsync(request.ClaimTypeId, cancellationToken);

        var claim = new Claim
        {
            Id = Guid.NewGuid(),
            Status = ClaimStatus.Open,
            CreatedAt = DateTime.UtcNow
        };
        ApplyChanges(claim, request);
        await repository.AddAsync(claim, cancellationToken);
        return ToResponse(claim);
    }

    public async Task<ClaimResponse?> UpdateAsync(Guid id, UpdateClaimRequest request, CancellationToken cancellationToken)
    {
        Validator.ValidateObject(request, new ValidationContext(request), validateAllProperties: true);
        var claim = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (claim is null)
            return null;

        await EnsureUniqueNumberAsync(request.ClaimNumber.Trim(), id, cancellationToken);
        await EnsureActiveClaimTypeAsync(request.ClaimTypeId, cancellationToken);
        ApplyChanges(claim, request);
        claim.Status = request.Status!.Value;
        claim.UpdatedAt = DateTime.UtcNow;
        await repository.UpdateAsync(claim, cancellationToken);
        return ToResponse(claim);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var claim = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (claim is null)
            return false;

        await repository.DeleteAsync(claim, cancellationToken);
        return true;
    }

    private async Task EnsureUniqueNumberAsync(string number, Guid? excludedId, CancellationToken cancellationToken)
    {
        if (await repository.ClaimNumberExistsAsync(number, excludedId, cancellationToken))
            throw new DuplicateClaimNumberException();
    }

    private async Task EnsureActiveClaimTypeAsync(int claimTypeId, CancellationToken cancellationToken)
    {
        if (!await claimTypeRepository.ExistsActiveAsync(claimTypeId, cancellationToken))
            throw new ValidationException("O tipo de sinistro informado é inválido.");
    }

    private static void ApplyChanges(Claim claim, CreateClaimRequest request)
    {
        claim.ClaimNumber = request.ClaimNumber.Trim();
        claim.PolicyNumber = request.PolicyNumber.Trim();
        claim.InsuredName = request.InsuredName.Trim();
        claim.InsuredDocument = DocumentNormalizer.Normalize(request.InsuredDocument);
        claim.ClaimTypeId = request.ClaimTypeId;
        claim.OccurrenceDate = request.OccurrenceDate.Date;
        claim.EstimatedAmount = request.EstimatedAmount;
        claim.Description = request.Description.Trim();
    }

    private static ClaimResponse ToResponse(Claim claim) => new(
        claim.Id, claim.ClaimNumber, claim.PolicyNumber, claim.InsuredName,
        claim.InsuredDocument, claim.ClaimTypeId, claim.ClaimType?.Name ?? string.Empty, claim.OccurrenceDate,
        claim.EstimatedAmount, claim.Description, claim.Status,
        claim.CreatedAt, claim.UpdatedAt);
}
