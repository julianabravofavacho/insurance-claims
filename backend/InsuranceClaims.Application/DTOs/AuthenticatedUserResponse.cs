namespace InsuranceClaims.Application.DTOs;

public sealed record AuthenticatedUserResponse(Guid Id, string Name, string Email);
