-- Create Tripora Tour Database
CREATE DATABASE IF NOT EXISTS tripora_tours CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE tripora_tours;

-- Create Tours table
CREATE TABLE IF NOT EXISTS Tours (
    Id CHAR(36) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000) NOT NULL,
    Destination NVARCHAR(200) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    DurationDays INT NOT NULL,
    Capacity INT NOT NULL,
    AvailableSlots INT NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    ImageUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL,
    DeletedAt DATETIME NULL,
    INDEX IX_Tours_Destination (Destination),
    INDEX IX_Tours_IsActive (IsActive),
    INDEX IX_Tours_Price (Price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;