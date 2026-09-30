using System.ComponentModel.DataAnnotations;
using InsuranceClaims.Application.Services;

namespace InsuranceClaims.Application.DTOs;

public sealed class ChangePasswordRequest : IValidatableObject
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = PasswordPolicy.MinimumLength)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    public string ConfirmNewPassword { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (NewPassword != ConfirmNewPassword)
            yield return new ValidationResult(
                "A confirmação da nova senha não confere.",
                new[] { nameof(ConfirmNewPassword) });

        if (CurrentPassword == NewPassword)
            yield return new ValidationResult(
                "A nova senha deve ser diferente da senha atual.",
                new[] { nameof(NewPassword) });

        if (!PasswordPolicy.IsValid(NewPassword))
            yield return new ValidationResult(
                PasswordPolicy.RequirementsMessage,
                new[] { nameof(NewPassword) });
    }
}
