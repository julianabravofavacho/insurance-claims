namespace InsuranceClaims.Api.Authentication;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "InsuranceClaims";
    public string Audience { get; set; } = "InsuranceClaimsFrontend";
    public string SecretKey { get; set; } = string.Empty;
    public int ExpiresInMinutes { get; set; } = 30;
}
