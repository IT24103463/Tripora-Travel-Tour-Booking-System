CREATE TABLE IF NOT EXISTS TravelPackages (
    Id CHAR(36) NOT NULL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    PackageType VARCHAR(100) NOT NULL,
    Description TEXT NOT NULL,
    Destination VARCHAR(255) NOT NULL,
    MinGuests INT NOT NULL DEFAULT 1,
    MaxGuests INT NOT NULL DEFAULT 10,
    DurationDays INT NOT NULL DEFAULT 1,
    DurationNights INT NOT NULL DEFAULT 0,
    PriceLKR DECIMAL(12, 2) NOT NULL,
    Inclusions TEXT NOT NULL,
    ImageUrl VARCHAR(500) NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX IX_TravelPackages_PackageType (PackageType),
    INDEX IX_TravelPackages_Destination (Destination),
    INDEX IX_TravelPackages_IsActive (IsActive)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS Offers (
    Id CHAR(36) NOT NULL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    TargetId CHAR(36) NOT NULL,
    DiscountPercentage INT NOT NULL DEFAULT 0,
    OriginalPriceLKR DECIMAL(12, 2) NOT NULL,
    OfferPriceLKR DECIMAL(12, 2) NOT NULL,
    BadgeText VARCHAR(100) NOT NULL,
    SpecialInclusions TEXT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX IX_Offers_Category_IsActive_StartDate_EndDate (Category, IsActive, StartDate, EndDate),
    INDEX IX_Offers_TargetId (TargetId)
) CHARACTER SET utf8mb4;

INSERT IGNORE INTO TravelPackages
(Id, Name, PackageType, Description, Destination, MinGuests, MaxGuests, DurationDays, DurationNights, PriceLKR, Inclusions, ImageUrl, IsActive)
VALUES
('7a1b0001-c82e-11f1-ba97-0a0027000001', 'Bentota Luxury Lagoon & Water Villa Private Day Out', 'DayOut', 'Private river cruise along Madu Ganga mangrove tunnels, exclusive beach cabana access, and 3-course seafood lunch for couples and families.', 'Bentota, Southern Province', 2, 6, 1, 0, 32000.00, '["Private Boat Safari", "3-Course Seafood Platter", "Beach Cabana Access", "Welcome King Coconut"]', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80', TRUE),
('7a1b0002-c82e-11f1-ba97-0a0027000002', 'Ella Cloud Valley Romantic Couple Escape', 'CoupleEscape', 'Bespoke romantic getaway including private scenic rail pickup, candlelit cliffside tea plantation dinner, and dawn trek to Little Adams Peak.', 'Ella, Central Highlands', 2, 2, 2, 1, 68000.00, '["First Class Observation Rail", "Private Romantic Dinner", "Tea Factory Tasting", "Chauffeur Guide"]', 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80', TRUE),
('7a1b0003-c82e-11f1-ba97-0a0027000003', 'Kitulgala White Water & Rainforest Friends Expedition', 'FriendsHangout', 'Action-packed white water rafting, canyoning, jungle barbecue, and twilight river bonfire designed for close circles and friend groups.', 'Kitulgala, Sabaragamuwa Province', 4, 10, 1, 0, 48000.00, '["Level 4 Rafting Gear & Instructor", "BBQ Buffet Lunch", "Rainforest Trek", "GoPro Video Footage"]', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', TRUE),
('7a1b0004-c82e-11f1-ba97-0a0027000004', 'Sigiriya & Minneriya Private Heritage Safari Odyssey', 'MultiDayTrip', 'Exclusive 3-day exploration with private 4x4 elephant tracking in Minneriya and sunrise climb to the Sigiriya Citadel with luxury glamping.', 'Sigiriya & Cultural Triangle', 2, 8, 3, 2, 115000.00, '["Private 4x4 Safari Jeep", "All National Park Passes", "Luxury Eco Glamping", "Dedicated Naturalist"]', 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80', TRUE);

INSERT IGNORE INTO Offers
(Id, Title, Category, TargetId, DiscountPercentage, OriginalPriceLKR, OfferPriceLKR, BadgeText, SpecialInclusions, StartDate, EndDate, IsActive)
VALUES
('8f1b0001-c82e-11f1-ba97-0a0027000001', 'Ella Cloud Forest Rail Odyssey - Seasonal Promo', 'Tour', '8d6d0828-b81e-11f1-ba97-0a002700000b', 15, 36000.00, 30600.00, '15% OFF SEASON SPECIAL', 'Complimentary private sunrise breakfast overlooking Nine Arches Bridge', '2026-10-01 00:00:00', '2026-11-30 23:59:59', TRUE),
('8f1b0002-c82e-11f1-ba97-0a0027000002', 'Bentota Lagoon Day Out - Group Special', 'Package', '7a1b0001-c82e-11f1-ba97-0a0027000001', 20, 32000.00, 25600.00, '20% OFF FLASH DEAL', 'Free cinnamon island demonstration and spiced tea tasting', '2026-10-01 00:00:00', '2026-12-15 23:59:59', TRUE);
