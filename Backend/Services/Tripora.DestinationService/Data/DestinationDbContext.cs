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
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    Name = "The Azure Horizon Resort",
                    Location = "South Malé Atoll, Maldives",
                    PricePerNight = 420.00m,
                    AvailableRooms = 15,
                    Rating = 5.0,
                    Amenities = "Ocean View, Private Pool, Free WiFi, Spa, Breakfast Included, Airport Shuttle",
                    Description = "Overwater luxury villas featuring direct lagoon access, sunset infinity pools, and world-class fine dining.",
                    ImageUrl = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Hotel {
                    Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    Name = "Grand Alpine Sanctuary",
                    Location = "Zermatt, Switzerland",
                    PricePerNight = 290.00m,
                    AvailableRooms = 25,
                    Rating = 4.0,
                    Amenities = "Ski-in/Ski-out, Spa & Sauna, Free WiFi, Mountain View, Restaurant, Bar",
                    Description = "Cozy alpine chalet-style architecture offering panoramic Matterhorn views, heated thermal baths, and fireside lounges.",
                    ImageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Hotel {
                    Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                    Name = "The Imperial Palace Hotel",
                    Location = "Tokyo, Japan",
                    PricePerNight = 195.00m,
                    AvailableRooms = 50,
                    Rating = 4.0,
                    Amenities = "Metro Access, Fitness Center, High-Speed WiFi, Room Service, Business Lounge",
                    Description = "Sleek contemporary rooms right in the vibrant heart of the city, steps away from transit lines and premier dining.",
                    ImageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Hotel {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                    Name = "Villa Positano Cliffside",
                    Location = "Amalfi Coast, Italy",
                    PricePerNight = 360.00m,
                    AvailableRooms = 8,
                    Rating = 5.0,
                    Amenities = "Sea Balcony, Complimentary Breakfast, Free WiFi, Concierge, Valet Parking",
                    Description = "Elegant cliff-perched boutique accommodation featuring terraced lemon gardens and panoramic Mediterranean seascapes.",
                    ImageUrl = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

        });
    }
}