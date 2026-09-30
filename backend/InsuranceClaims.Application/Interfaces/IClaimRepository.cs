using InsuranceClaims.Application.DTOs;
using InsuranceClaims.Domain.Entities;

namespace InsuranceClaims.Application.Interfaces;

public interface IClaimRepository
{
    Task<IReadOnlyList<Claim>> GetPagedAsync(ClaimFilterRequest request, CancellationToken cancellationToken);
    Task<int> CountAsync(ClaimFilterRequest request, CancellationToken cancellationToken);
    Task<ClaimDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken);
    Task<Claim?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Claim?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> ClaimNumberExistsAsync(string claimNumber, Guid? excludedId, CancellationToken cancellationToken);
    Task AddAsync(Claim claim, CancellationToken cancellationToken);
    Task UpdateAsync(Claim claim, CancellationToken cancellationToken);
    Task DeleteAsync(Claim claim, CancellationToken cancellationToken);
}
