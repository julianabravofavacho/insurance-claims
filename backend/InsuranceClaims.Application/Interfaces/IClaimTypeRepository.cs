using InsuranceClaims.Domain.Entities;

namespace InsuranceClaims.Application.Interfaces;

public interface IClaimTypeRepository
{
    Task<IReadOnlyList<ClaimType>> GetActiveAsync(CancellationToken cancellationToken);
    Task<bool> ExistsActiveAsync(int id, CancellationToken cancellationToken);
}
