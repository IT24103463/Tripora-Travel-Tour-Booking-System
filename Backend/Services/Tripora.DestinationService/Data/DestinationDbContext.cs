using System;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Data;

public class DestinationDbContext : DbContext
{
    public DestinationDbContext(DbContextOptions<DestinationDbContext> options) : base(options)
    {
    }

    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<Hotel> Hotels => Set<Hotel>();

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
                .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

            entity.HasIndex(t => t.Destination);
            entity.HasIndex(t => t.IsActive);
            entity.HasIndex(t => t.Price);

            entity.HasData(
                new Tour {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Name = "Alpine Glacier Explorer",
                    Destination = "Interlaken, Switzerland",
                    DurationDays = 5,
                    Price = 1250.00m,
                    Capacity = 20,
                    AvailableSlots = 20,
                    Description = "Hike breathtaking Alpine trails, explore ancient ice caves, and experience scenic cogwheel rail journeys through the Jungfrau region.",
                    ImageUrl = "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Tour {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Name = "Serengeti Wildlife Safari",
                    Destination = "Arusha, Tanzania",
                    DurationDays = 7,
                    Price = 2800.00m,
                    Capacity = 12,
                    AvailableSlots = 12,
                    Description = "Witness the Great Migration up close with guided off-road drives, luxury tent camps, and panoramic savannah sunsets.",
                    ImageUrl = "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Tour {
                    Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "Kyoto Cultural Heritage Walk",
                    Destination = "Kyoto, Japan",
                    DurationDays = 4,
                    Price = 890.00m,
                    Capacity = 15,
                    AvailableSlots = 15,
                    Description = "Stroll through historic bamboo groves, ancient Shinto shrines, and participate in authentic traditional tea ceremonies.",
                    ImageUrl = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Tour {
                    Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Name = "Amalfi Coastline Cruise",
                    Destination = "Positano, Italy",
                    DurationDays = 6,
                    Price = 1750.00m,
                    Capacity = 10,
                    AvailableSlots = 10,
                    Description = "Sail past dramatic cliffside villages, explore hidden coves, and sample authentic regional Mediterranean cuisine.",
                    ImageUrl = "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

        });

        modelBuilder.Entity<Hotel>(entity =>
        {
            entity.HasKey(h => h.Id);

            entity.Property(h => h.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(h => h.Description)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(h => h.Location)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(h => h.PricePerNight)
                .IsRequired()
                .HasPrecision(18, 2);

            entity.Property(h => h.TotalRooms)
                .IsRequired();

            entity.Property(h => h.AvailableRooms)
                .IsRequired();

            entity.Property(h => h.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(h => h.ImageUrl)
                .HasMaxLength(500);

            entity.Property(h => h.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

            entity.HasIndex(h => h.Location);
            entity.HasIndex(h => h.IsActive);
            entity.HasIndex(h => h.PricePerNight);

            entity.HasData(
                new Hotel {
                    Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                    Name = "Heritance Kandalama",
                    Location = "Sigiriya / Dambulla, Sri Lanka",
                    PricePerNight = 180.00m,
                    TotalRooms = 32,
                    AvailableRooms = 32,
                    Rating = 4.8,
                    Amenities = "Infinity Pool, Free WiFi, Spa, Breakfast Included, Restaurant, Airport Shuttle",
                    Description = "A luxury eco-resort immersed in forested hills overlooking the ancient landscapes of Sigiriya and Dambulla.",
                    ImageUrl = "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Hotel {
                    Id = Guid.Parse("aaaaaaaa-1111-1111-1111-111111111111"),
                    Name = "98 Acres Resort & Spa",
                    Location = "Ella, Sri Lanka",
                    PricePerNight = 220.00m,
                    TotalRooms = 24,
                    AvailableRooms = 24,
                    Rating = 4.9,
                    Amenities = "Mountain View, Spa, Free WiFi, Breakfast Included, Restaurant, Hiking Trails",
                    Description = "A boutique mountain retreat surrounded by tea plantations with sweeping views of Ella's green valleys.",
                    ImageUrl = "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Hotel {
                    Id = Guid.Parse("bbbbbbbb-2222-2222-2222-222222222222"),
                    Name = "Cinnamon Bentota Beach",
                    Location = "Bentota, Sri Lanka",
                    PricePerNight = 160.00m,
                    TotalRooms = 48,
                    AvailableRooms = 48,
                    Rating = 4.7,
                    Amenities = "Beach Access, Swimming Pool, Free WiFi, Spa, Breakfast Included, Water Sports",
                    Description = "A beachfront luxury resort offering tropical gardens, calm ocean views, and effortless coastal living.",
                    ImageUrl = "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Hotel {
                    Id = Guid.Parse("cccccccc-3333-3333-3333-333333333333"),
                    Name = "Galle Fort Hotel",
                    Location = "Galle, Sri Lanka",
                    PricePerNight = 140.00m,
                    TotalRooms = 14,
                    AvailableRooms = 14,
                    Rating = 4.6,
                    Amenities = "Heritage Architecture, Courtyard Pool, Free WiFi, Breakfast Included, Restaurant, Concierge",
                    Description = "An intimate heritage boutique hotel inside historic Galle Fort, blending colonial character with modern comfort.",
                    ImageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

        });
    }
}