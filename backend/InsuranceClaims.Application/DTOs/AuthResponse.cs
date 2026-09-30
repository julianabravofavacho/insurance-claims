namespace InsuranceClaims.Application.DTOs;

public sealed record AuthResponse(
    string AccessToken,
    DateTime ExpiresAt,
    AuthenticatedUserResponse User);
