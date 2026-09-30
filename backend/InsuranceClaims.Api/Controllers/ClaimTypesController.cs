using InsuranceClaims.Application.DTOs;
using InsuranceClaims.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsuranceClaims.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/claim-types")]
public sealed class ClaimTypesController(IClaimTypeService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClaimTypeResponse>>> GetActive(CancellationToken cancellationToken) =>
        Ok(await service.GetActiveAsync(cancellationToken));
}
