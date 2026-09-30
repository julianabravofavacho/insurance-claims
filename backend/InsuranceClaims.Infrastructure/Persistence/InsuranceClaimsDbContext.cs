using InsuranceClaims.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InsuranceClaims.Infrastructure.Persistence;

public sealed class InsuranceClaimsDbContext(DbContextOptions<InsuranceClaimsDbContext> options)
    : DbContext(options)
{
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<ClaimType> ClaimTypes => Set<ClaimType>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var claim = modelBuilder.Entity<Claim>();
        claim.ToTable("Claims");
        claim.HasKey(x => x.Id);
        claim.Property(x => x.Id).ValueGeneratedNever();
        claim.Property(x => x.ClaimNumber).HasMaxLength(50).IsRequired();
        claim.HasIndex(x => x.ClaimNumber).IsUnique().HasFilter("[DeletedAt] IS NULL");
        claim.Property(x => x.PolicyNumber).HasMaxLength(50).IsRequired();
        claim.Property(x => x.InsuredName).HasMaxLength(200).IsRequired();
        claim.Property(x => x.InsuredDocument).HasMaxLength(30).IsRequired();
        claim.Property(x => x.ClaimTypeId).IsRequired();
        claim.HasOne(x => x.ClaimType)
            .WithMany()
            .HasForeignKey(x => x.ClaimTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        claim.Property(x => x.OccurrenceDate).HasColumnType("date");
        claim.Property(x => x.EstimatedAmount).HasPrecision(18, 2);
        claim.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        claim.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        claim.Property(x => x.CreatedAt)
            .HasConversion(value => value, value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
        claim.Property(x => x.UpdatedAt)
            .HasConversion(value => value,
                value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : (DateTime?)null);
        claim.Property(x => x.DeletedAt)
            .HasConversion(value => value,
                value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : (DateTime?)null);

        var claimType = modelBuilder.Entity<ClaimType>();
        claimType.ToTable("ClaimTypes");
        claimType.HasKey(x => x.Id);
        claimType.Property(x => x.Id).ValueGeneratedNever();
        claimType.Property(x => x.Name).HasMaxLength(80).IsRequired();
        claimType.Property(x => x.IsActive).IsRequired();
        claimType.Property(x => x.DisplayOrder).IsRequired();
        claimType.HasIndex(x => x.Name).IsUnique();
        claimType.HasData(
            new ClaimType { Id = 1, Name = "Colisão", IsActive = true, DisplayOrder = 1 },
            new ClaimType { Id = 2, Name = "Roubo/Furto", IsActive = true, DisplayOrder = 2 },
            new ClaimType { Id = 3, Name = "Danos naturais", IsActive = true, DisplayOrder = 3 },
            new ClaimType { Id = 4, Name = "Incêndio", IsActive = true, DisplayOrder = 4 },
            new ClaimType { Id = 5, Name = "Terceiros", IsActive = true, DisplayOrder = 5 },
            new ClaimType { Id = 6, Name = "Vidros", IsActive = true, DisplayOrder = 6 },
            new ClaimType { Id = 7, Name = "Outros", IsActive = true, DisplayOrder = 7 });

        var user = modelBuilder.Entity<User>();
        user.ToTable("Users");
        user.HasKey(x => x.Id);
        user.Property(x => x.Id).ValueGeneratedNever();
        user.Property(x => x.Name).HasMaxLength(150).IsRequired();
        user.Property(x => x.Email).HasMaxLength(200).IsRequired();
        user.Property(x => x.NormalizedEmail).HasMaxLength(200).IsRequired();
        user.HasIndex(x => x.NormalizedEmail).IsUnique();
        user.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        user.Property(x => x.IsActive).IsRequired();
        user.Property(x => x.CreatedAt)
            .HasConversion(value => value, value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
        user.Property(x => x.UpdatedAt)
            .HasConversion(value => value,
                value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : (DateTime?)null);
    }
}
