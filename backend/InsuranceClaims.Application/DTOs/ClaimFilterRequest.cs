using InsuranceClaims.Domain.Enums;

namespace InsuranceClaims.Application.DTOs;

public sealed class ClaimFilterRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public ClaimStatus? Status { get; set; }
    public string? ClaimType { get; set; }
    public DateTime? OccurrenceDateFrom { get; set; }
    public DateTime? OccurrenceDateTo { get; set; }
    public decimal? EstimatedAmountMin { get; set; }
    public decimal? EstimatedAmountMax { get; set; }
}
