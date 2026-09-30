using InsuranceClaims.Domain.Enums;

namespace InsuranceClaims.Domain.Entities;

public sealed class Claim
{
    public Guid Id { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public string PolicyNumber { get; set; } = string.Empty;
    public string InsuredName { get; set; } = string.Empty;
    public string InsuredDocument { get; set; } = string.Empty;
    public int ClaimTypeId { get; set; }
    public ClaimType? ClaimType { get; set; }
    public DateTime OccurrenceDate { get; set; }
    public decimal EstimatedAmount { get; set; }
    public string Description { get; set; } = string.Empty;
    public ClaimStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
