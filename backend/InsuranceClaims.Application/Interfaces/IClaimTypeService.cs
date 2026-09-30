using InsuranceClaims.Application.DTOs;

namespace InsuranceClaims.Application.Interfaces;

public interface IClaimTypeService
{
    Task<IReadOnlyList<ClaimTypeResponse>> GetActiveAsync(CancellationToken cancellationToken);
}
