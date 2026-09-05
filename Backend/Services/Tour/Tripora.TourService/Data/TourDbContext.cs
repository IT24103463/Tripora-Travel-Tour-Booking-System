using Microsoft.EntityFrameworkCore;
using Tripora.TourService.Models;

namespace Tripora.TourService.Data;

public class TourDbContext : DbContext
{
    public TourDbContext(DbContextOptions<TourDbContext> options) : base(options)
    {
    }

    public DbSet<Tour> Tours => Set<Tour>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tour>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.Property(t => t.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(t => t.Description)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(t => t.Destination)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(t => t.Price)
                .IsRequired()
                .HasPrecision(18, 2);

            entity.Property(t => t.DurationDays)
                .IsRequired();

            entity.Property(t => t.Capacity)
                .IsRequired();

            entity.Property(t => t.AvailableSlots)
                .IsRequired();

            entity.Property(t => t.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(t => t.ImageUrl)
                .HasMaxLength(500);

            entity.Property(t => t.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("datetime('now')");

            entity.HasIndex(t => t.Destination);
            entity.HasIndex(t => t.IsActive);
            entity.HasIndex(t => t.Price);
        });
    }
}