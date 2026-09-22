using Microsoft.EntityFrameworkCore;
using Tripora.PaymentService.Models;

namespace Tripora.PaymentService.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options) { }

    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.BookingId);
            entity.Property(p => p.UserId).HasMaxLength(36).IsRequired();
            entity.HasIndex(p => p.UserId);
            entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");
            entity.Property(p => p.PaymentMethod).HasMaxLength(50);
            entity.Property(p => p.Status).HasMaxLength(50).HasDefaultValue("Pending");
            entity.Property(p => p.TransactionId).HasMaxLength(100);
            entity.HasIndex(p => p.TransactionId).IsUnique();
        });

        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.ToTable("PaymentOutboxMessages");
            entity.HasKey(o => o.Id);
            entity.Property(o => o.EventType).HasMaxLength(100).IsRequired();
            entity.Property(o => o.Payload).HasColumnType("longtext").IsRequired();
            entity.Property(o => o.CreatedAt).IsRequired();
            entity.Property(o => o.ErrorMessage).HasColumnType("text");
            entity.HasIndex(o => o.ProcessedAt);
        });
    }
}