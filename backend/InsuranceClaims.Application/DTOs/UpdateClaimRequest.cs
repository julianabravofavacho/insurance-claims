using System.ComponentModel.DataAnnotations;
using InsuranceClaims.Domain.Enums;

namespace InsuranceClaims.Application.DTOs;

public sealed class UpdateClaimRequest : CreateClaimRequest
{
    [Required, EnumDataType(typeof(ClaimStatus))]
    public ClaimStatus? Status { get; set; }
}
