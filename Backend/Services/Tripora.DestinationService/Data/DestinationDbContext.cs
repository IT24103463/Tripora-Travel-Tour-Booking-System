using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Data;

public class DestinationDbContext : DbContext
{
    public DestinationDbContext(DbContextOptions<DestinationDbContext> options) : base(options)
    {
    }

    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<TravelPackage> TravelPackages => Set<TravelPackage>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<Inquiry> Inquiries => Set<Inquiry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Inquiry>(entity =>
        {
            entity.ToTable("inquiries");
            entity.HasKey(inquiry => inquiry.Id);
            entity.Property(inquiry => inquiry.Id).ValueGeneratedOnAdd();
            entity.Property(inquiry => inquiry.Name).IsRequired().HasMaxLength(150).HasColumnName("name");
            entity.Property(inquiry => inquiry.PhoneNumber).IsRequired().HasMaxLength(50).HasColumnName("phone_number");
            entity.Property(inquiry => inquiry.Reason).IsRequired().HasMaxLength(100).HasColumnName("reason");
            entity.Property(inquiry => inquiry.Message).IsRequired().HasColumnName("message");
            entity.Property(inquiry => inquiry.Status).IsRequired().HasMaxLength(30).HasDefaultValue("UNREAD").HasColumnName("status");
            entity.Property(inquiry => inquiry.CreatedAt).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP(6)").HasColumnName("created_at");
            entity.HasIndex(inquiry => new { inquiry.Status, inquiry.CreatedAt });
        });

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

        modelBuilder.Entity<TravelPackage>(entity =>
        {
            entity.ToTable("TravelPackages");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasColumnType("char(36)");
            entity.Property(p => p.Name).IsRequired().HasMaxLength(255);
            entity.Property(p => p.PackageType).IsRequired().HasMaxLength(100);
            entity.Property(p => p.Description).IsRequired().HasColumnType("text");
            entity.Property(p => p.Destination).IsRequired().HasMaxLength(255);
            entity.Property(p => p.MinGuests).IsRequired().HasDefaultValue(1);
            entity.Property(p => p.MaxGuests).IsRequired().HasDefaultValue(10);
            entity.Property(p => p.DurationDays).IsRequired().HasDefaultValue(1);
            entity.Property(p => p.DurationNights).IsRequired().HasDefaultValue(0);
            entity.Property(p => p.PriceLKR).IsRequired().HasPrecision(12, 2);
            entity.Property(p => p.Inclusions)
                .HasConversion(
                    values => JsonSerializer.Serialize(values, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (left, right) => left != null && right != null && left.SequenceEqual(right),
                    values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value.GetHashCode())),
                    values => values.ToList()))
                ;
            entity.Property(p => p.Inclusions).HasColumnType("text");
            entity.Property(p => p.ImageUrl).IsRequired().HasMaxLength(500);
            entity.Property(p => p.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(p => p.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(p => p.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                .ValueGeneratedOnAddOrUpdate();
            entity.HasIndex(p => p.PackageType);
            entity.HasIndex(p => p.Destination);
            entity.HasIndex(p => p.IsActive);
            entity.HasData(
                new TravelPackage
                {
                    Id = Guid.Parse("7a1b0001-c82e-11f1-ba97-0a0027000001"),
                    Name = "Bentota Luxury Lagoon & Water Villa Private Day Out",
                    PackageType = "DayOut",
                    Description = "Private river cruise along Madu Ganga mangrove tunnels, exclusive beach cabana access, and 3-course seafood lunch for couples and families.",
                    Destination = "Bentota, Southern Province",
                    MinGuests = 2,
                    MaxGuests = 6,
                    DurationDays = 1,
                    DurationNights = 0,
                    PriceLKR = 32000.00m,
                    Inclusions = ["Private Boat Safari", "3-Course Seafood Platter", "Beach Cabana Access", "Welcome King Coconut"],
                    ImageUrl = "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 25, 0, 0, 0, DateTimeKind.Utc)
                },
                new TravelPackage
                {
                    Id = Guid.Parse("7a1b0002-c82e-11f1-ba97-0a0027000002"),
                    Name = "Ella Cloud Valley Romantic Couple Escape",
                    PackageType = "CoupleEscape",
                    Description = "Bespoke romantic getaway including private scenic rail pickup, candlelit cliffside tea plantation dinner, and dawn trek to Little Adams Peak.",
                    Destination = "Ella, Central Highlands",
                    MinGuests = 2,
                    MaxGuests = 2,
                    DurationDays = 2,
                    DurationNights = 1,
                    PriceLKR = 68000.00m,
                    Inclusions = ["First Class Observation Rail", "Private Romantic Dinner", "Tea Factory Tasting", "Chauffeur Guide"],
                    ImageUrl = "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 25, 0, 0, 0, DateTimeKind.Utc)
                },
                new TravelPackage
                {
                    Id = Guid.Parse("7a1b0003-c82e-11f1-ba97-0a0027000003"),
                    Name = "Kitulgala White Water & Rainforest Friends Expedition",
                    PackageType = "FriendsHangout",
                    Description = "Action-packed white water rafting, canyoning, jungle barbecue, and twilight river bonfire designed for close circles and friend groups.",
                    Destination = "Kitulgala, Sabaragamuwa Province",
                    MinGuests = 4,
                    MaxGuests = 10,
                    DurationDays = 1,
                    DurationNights = 0,
                    PriceLKR = 48000.00m,
                    Inclusions = ["Level 4 Rafting Gear & Instructor", "BBQ Buffet Lunch", "Rainforest Trek", "GoPro Video Footage"],
                    ImageUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 25, 0, 0, 0, DateTimeKind.Utc)
                },
                new TravelPackage
                {
                    Id = Guid.Parse("7a1b0004-c82e-11f1-ba97-0a0027000004"),
                    Name = "Sigiriya & Minneriya Private Heritage Safari Odyssey",
                    PackageType = "MultiDayTrip",
                    Description = "Exclusive 3-day exploration with private 4x4 elephant tracking in Minneriya and sunrise climb to the Sigiriya Citadel with luxury glamping.",
                    Destination = "Sigiriya & Cultural Triangle",
                    MinGuests = 2,
                    MaxGuests = 8,
                    DurationDays = 3,
                    DurationNights = 2,
                    PriceLKR = 115000.00m,
                    Inclusions = ["Private 4x4 Safari Jeep", "All National Park Passes", "Luxury Eco Glamping", "Dedicated Naturalist"],
                    ImageUrl = "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 25, 0, 0, 0, DateTimeKind.Utc)
                });
        });

        modelBuilder.Entity<Offer>(entity =>
        {
            entity.ToTable("Offers");
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Id).HasColumnType("char(36)");
            entity.Property(o => o.Title).IsRequired().HasMaxLength(255);
            entity.Property(o => o.Category).IsRequired().HasMaxLength(50);
            entity.Property(o => o.TargetId).HasColumnType("char(36)");
            entity.Property(o => o.DiscountPercentage).HasDefaultValue(0);
            entity.Property(o => o.OriginalPriceLKR).IsRequired().HasPrecision(12, 2);
            entity.Property(o => o.OfferPriceLKR).IsRequired().HasPrecision(12, 2);
            entity.Property(o => o.BadgeText).IsRequired().HasMaxLength(100);
            entity.Property(o => o.ImageUrl).HasMaxLength(500);
            entity.Property(o => o.SpecialInclusions).HasColumnType("text");
            entity.Property(o => o.StartDate).IsRequired().HasColumnType("datetime");
            entity.Property(o => o.EndDate).IsRequired().HasColumnType("datetime");
            entity.Property(o => o.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(o => o.CreatedAt).HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(o => new { o.Category, o.IsActive, o.StartDate, o.EndDate });
            entity.HasIndex(o => o.TargetId);
            entity.HasData(
                new Offer
                {
                    Id = Guid.Parse("8f1b0001-c82e-11f1-ba97-0a0027000001"),
                    Title = "Ella Cloud Forest Rail Odyssey - Seasonal Promo",
                    Category = "Tour",
                    TargetId = Guid.Parse("8d6d0828-b81e-11f1-ba97-0a002700000b"),
                    DiscountPercentage = 15,
                    OriginalPriceLKR = 36000.00m,
                    OfferPriceLKR = 30600.00m,
                    BadgeText = "15% OFF SEASON SPECIAL",
                    SpecialInclusions = "Complimentary private sunrise breakfast overlooking Nine Arches Bridge",
                    StartDate = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(2026, 11, 30, 23, 59, 59, DateTimeKind.Utc),
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 25, 0, 0, 0, DateTimeKind.Utc)
                },
                new Offer
                {
                    Id = Guid.Parse("8f1b0002-c82e-11f1-ba97-0a0027000002"),
                    Title = "Bentota Lagoon Day Out - Group Special",
                    Category = "Package",
                    TargetId = Guid.Parse("7a1b0001-c82e-11f1-ba97-0a0027000001"),
                    DiscountPercentage = 20,
                    OriginalPriceLKR = 32000.00m,
                    OfferPriceLKR = 25600.00m,
                    BadgeText = "20% OFF FLASH DEAL",
                    SpecialInclusions = "Free cinnamon island demonstration and spiced tea tasting",
                    StartDate = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(2026, 12, 15, 23, 59, 59, DateTimeKind.Utc),
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 25, 0, 0, 0, DateTimeKind.Utc)
                });
        });
    }
}
