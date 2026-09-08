-- Create Tripora User Database
CREATE DATABASE IF NOT EXISTS tripora_users CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE tripora_users;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    Id CHAR(36) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Customer',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL,
    INDEX IX_Users_Email (Email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;