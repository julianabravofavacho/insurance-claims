using InsuranceClaims.Application.DTOs;
using InsuranceClaims.Application.Interfaces;

namespace InsuranceClaims.Application.Services;

public sealed class ClaimTypeService(IClaimTypeRepository repository) : IClaimTypeService
{
    public async Task<IReadOnlyList<ClaimTypeResponse>> GetActiveAsync(CancellationToken cancellationToken)
    {
        var claimTypes = await repository.GetActiveAsync(cancellationToken);
        return claimTypes
            .Select(x => new ClaimTypeResponse(x.Id, x.Name))
            .ToList();
    }
}
