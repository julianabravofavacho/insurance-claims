using InsuranceClaims.Application.DTOs;

namespace InsuranceClaims.Application.Interfaces;

public interface IClaimService
{
    Task<PagedResult<ClaimResponse>> GetAllAsync(ClaimFilterRequest request, CancellationToken cancellationToken);
    Task<ClaimDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken);
    Task<ClaimResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ClaimResponse> CreateAsync(CreateClaimRequest request, CancellationToken cancellationToken);
    Task<ClaimResponse?> UpdateAsync(Guid id, UpdateClaimRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
