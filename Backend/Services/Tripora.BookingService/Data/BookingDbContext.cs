using Microsoft.EntityFrameworkCore;
using Tripora.BookingService.Models;

namespace Tripora.BookingService.Data;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options) { }

    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.UserId).HasMaxLength(36).IsRequired();
            entity.HasIndex(b => b.UserId);
            entity.HasIndex(b => b.TourId);
            entity.HasIndex(b => b.HotelId);
            entity.Property(b => b.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(b => b.BookingType).HasConversion<string>().HasMaxLength(50);
            entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(50).HasDefaultValue("Pending");
            entity.Property(b => b.GuestName).HasMaxLength(200);
            entity.Property(b => b.PhoneNumber).HasMaxLength(50);
            entity.Property(b => b.BillingAddress).HasMaxLength(500);
            entity.Property(b => b.ItemType).HasMaxLength(50);
            entity.Property(b => b.LegacyStatus).HasMaxLength(50);
        });

        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.ToTable("OutboxMessages");
            entity.HasKey(o => o.Id);
            entity.Property(o => o.EventType).HasMaxLength(100).IsRequired();
            entity.Property(o => o.Payload).HasColumnType("longtext").IsRequired();
            entity.Property(o => o.CreatedAt).IsRequired();
            entity.Property(o => o.RetryCount).HasDefaultValue(0);
            entity.Property(o => o.ErrorMessage).HasMaxLength(2000);

            // Index to accelerate OutboxPublisherWorker queries:
            // WHERE ProcessedAt IS NULL ORDER BY CreatedAt
            entity.HasIndex(o => new { o.ProcessedAt, o.CreatedAt });
        });
    }
}