using InsuranceClaims.Application.DTOs;
using InsuranceClaims.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsuranceClaims.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/claims")]
public sealed class ClaimsController(IClaimService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ClaimResponse>>> GetAll(
        [FromQuery] ClaimFilterRequest request,
        CancellationToken cancellationToken = default) =>
        Ok(await service.GetAllAsync(request, cancellationToken));

    [HttpGet("dashboard")]
    public async Task<ActionResult<ClaimDashboardResponse>> GetDashboard(CancellationToken cancellationToken) =>
        Ok(await service.GetDashboardAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClaimResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var claim = await service.GetByIdAsync(id, cancellationToken);
        return claim is null ? NotFound() : Ok(claim);
    }

    [HttpPost]
    public async Task<ActionResult<ClaimResponse>> Create(CreateClaimRequest request, CancellationToken cancellationToken)
    {
        var claim = await service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = claim.Id }, claim);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClaimResponse>> Update(Guid id, UpdateClaimRequest request, CancellationToken cancellationToken)
    {
        var claim = await service.UpdateAsync(id, request, cancellationToken);
        return claim is null ? NotFound() : Ok(claim);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        await service.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();
}
