using InsuranceClaims.Application.Interfaces;
using InsuranceClaims.Domain.Entities;
using InsuranceClaims.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsuranceClaims.Infrastructure.Repositories;

public sealed class ClaimTypeRepository(InsuranceClaimsDbContext context) : IClaimTypeRepository
{
    public async Task<IReadOnlyList<ClaimType>> GetActiveAsync(CancellationToken cancellationToken) =>
        await context.ClaimTypes
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

    public Task<bool> ExistsActiveAsync(int id, CancellationToken cancellationToken) =>
        context.ClaimTypes.AnyAsync(x => x.Id == id && x.IsActive, cancellationToken);
}
