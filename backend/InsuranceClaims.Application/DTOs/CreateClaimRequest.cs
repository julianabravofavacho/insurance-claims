using System.ComponentModel.DataAnnotations;
using InsuranceClaims.Application.Services;

namespace InsuranceClaims.Application.DTOs;

public class CreateClaimRequest : IValidatableObject
{
    [Required, StringLength(50)]
    public string ClaimNumber { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string PolicyNumber { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string InsuredName { get; set; } = string.Empty;

    [Required, StringLength(30)]
    public string InsuredDocument { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "O tipo de sinistro é obrigatório.")]
    public int ClaimTypeId { get; set; }

    public DateTime OccurrenceDate { get; set; }

    [Range(typeof(decimal), "0", "9999999999999999.99", ParseLimitsInInvariantCulture = true)]
    public decimal EstimatedAmount { get; set; }

    [Required, StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var normalizedDocument = DocumentNormalizer.Normalize(InsuredDocument);

        if (!DocumentNormalizer.IsValid(normalizedDocument))
            yield return new ValidationResult(
                "O CPF/CNPJ do segurado deve possuir 11 dígitos para CPF ou 14 posições alfanuméricas para CNPJ.",
                new[] { nameof(InsuredDocument) });

        if (OccurrenceDate == default || OccurrenceDate.Date > DateTime.UtcNow.Date)
            yield return new ValidationResult(
                "A data de ocorrência é obrigatória e não pode ser futura.",
                new[] { nameof(OccurrenceDate) });

        if (decimal.Round(EstimatedAmount, 2) != EstimatedAmount)
            yield return new ValidationResult(
                "O valor estimado deve ter no máximo duas casas decimais.",
                new[] { nameof(EstimatedAmount) });
    }
}
