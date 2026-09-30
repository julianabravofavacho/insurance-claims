using InsuranceClaims.Application.Interfaces;
using InsuranceClaims.Application.Services;
using InsuranceClaims.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InsuranceClaims.Infrastructure.Persistence;

public sealed class AuthSeedService(
    InsuranceClaimsDbContext context,
    IConfiguration configuration,
    IPasswordHasher passwordHasher,
    ILogger<AuthSeedService> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var email = configuration["AuthSeed:Email"];
        var password = configuration["AuthSeed:Password"];
        var name = configuration["AuthSeed:Name"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return;

        if (password.Length < 8)
            throw new InvalidOperationException("AuthSeed:Password deve possuir pelo menos 8 caracteres.");

        var normalizedEmail = AuthService.NormalizeEmail(email);
        var userExists = await context.Users.AnyAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken);
        if (userExists)
            return;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = string.IsNullOrWhiteSpace(name) ? email.Trim() : name.Trim(),
            Email = email.Trim(),
            NormalizedEmail = normalizedEmail,
            PasswordHash = passwordHasher.Hash(password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Usuário inicial de autenticação criado: {Email}", user.Email);
    }
}
