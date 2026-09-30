using System.Text.RegularExpressions;

namespace InsuranceClaims.Application.Services;

internal static partial class DocumentNormalizer
{
    private const int CpfLength = 11;
    private const int CnpjLength = 14;

    public static string Normalize(string value) =>
        FormattingCharactersRegex().Replace(value.Trim(), string.Empty).ToUpperInvariant();

    public static bool IsValid(string normalizedValue)
    {
        if (DigitsOnlyRegex().IsMatch(normalizedValue))
            return normalizedValue.Length switch
            {
                CpfLength => IsValidCpf(normalizedValue),
                CnpjLength => IsValidNumericCnpj(normalizedValue),
                _ => false
            };

        return IsValidAlphanumericCnpj(normalizedValue);
    }

    private static bool IsValidCpf(string value)
    {
        if (HasRepeatedDigits(value))
            return false;

        var firstDigit = CalculateDigit(value, 9, 10);
        var secondDigit = CalculateDigit(value, 10, 11);

        return value[9] == ToDigitChar(firstDigit) && value[10] == ToDigitChar(secondDigit);
    }

    private static bool IsValidNumericCnpj(string value)
    {
        if (HasRepeatedDigits(value))
            return false;

        var firstDigit = CalculateCnpjDigit(value, firstDigit: true);
        var secondDigit = CalculateCnpjDigit(value, firstDigit: false);

        return value[12] == ToDigitChar(firstDigit) && value[13] == ToDigitChar(secondDigit);
    }

    private static bool IsValidAlphanumericCnpj(string value) =>
        value.Length == CnpjLength &&
        AlphaNumericRegex().IsMatch(value) &&
        value.Any(char.IsLetter);

    private static bool HasRepeatedDigits(string value) =>
        value.All(character => character == value[0]);

    private static int CalculateDigit(string value, int length, int initialWeight)
    {
        var sum = 0;
        for (var index = 0; index < length; index++)
            sum += ToDigit(value[index]) * (initialWeight - index);

        var remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    private static int CalculateCnpjDigit(string value, bool firstDigit)
    {
        var weights = firstDigit
            ? new[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 }
            : new[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        var sum = 0;
        for (var index = 0; index < weights.Length; index++)
            sum += ToDigit(value[index]) * weights[index];

        var remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    private static int ToDigit(char character) => character - '0';

    private static char ToDigitChar(int digit) => (char)('0' + digit);

    [GeneratedRegex(@"[^A-Za-z0-9]")]
    private static partial Regex FormattingCharactersRegex();

    [GeneratedRegex(@"^\d+$")]
    private static partial Regex DigitsOnlyRegex();

    [GeneratedRegex(@"^[A-Z0-9]+$")]
    private static partial Regex AlphaNumericRegex();
}
