namespace InsuranceClaims.Domain.Entities;

public sealed class ClaimType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}
