namespace InsuranceClaims.Application.Services;

public static class PasswordPolicy
{
    public const int MinimumLength = 8;
    public const string RequirementsMessage =
        "A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.";

    public static bool IsValid(string password) =>
        !string.IsNullOrWhiteSpace(password) &&
        password.Length >= MinimumLength &&
        password.Any(char.IsUpper) &&
        password.Any(char.IsLower) &&
        password.Any(char.IsDigit) &&
        password.Any(IsSpecialCharacter);

    private static bool IsSpecialCharacter(char character) =>
        !char.IsLetterOrDigit(character);
}
