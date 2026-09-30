using InsuranceClaims.Domain.Entities;

namespace InsuranceClaims.Application.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) Generate(User user);
}
