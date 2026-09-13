using Microsoft.EntityFrameworkCore;
using Tripora.BookingService.Models;

namespace Tripora.BookingService.Data;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options) { }

    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.HasIndex(b => b.UserId);
            entity.HasIndex(b => b.TourId);
            entity.HasIndex(b => b.HotelId);
            entity.Property(b => b.TotalAmount).HasColumnType("TEXT");
            entity.Property(b => b.BookingType).HasConversion<string>();
            entity.Property(b => b.Status).HasConversion<string>();
        });
    }
}
