using Microsoft.EntityFrameworkCore;
using Tripora.TourService.Data;
using Tripora.TourService.Models;

namespace Tripora.TourService.Repositories;

public class TourRepository : ITourRepository
{
    private readonly TourDbContext _dbContext;

    public TourRepository(TourDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Tour?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tours
            .FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null, cancellationToken);
    }

    public async Task<List<Tour>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tours
            .Where(t => t.DeletedAt == null)
            .OrderBy(t => t.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Tour>> GetActiveToursAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tours
            .Where(t => t.DeletedAt == null && t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Tour> CreateAsync(Tour tour, CancellationToken cancellationToken = default)
    {
        tour.CreatedAt = DateTime.UtcNow;
        tour.AvailableSlots = tour.Capacity; // Initially, all slots are available
        
        _dbContext.Tours.Add(tour);
        await _dbContext.SaveChangesAsync(cancellationToken);
        
        return tour;
    }

    public async Task<Tour?> UpdateAsync(Tour tour, CancellationToken cancellationToken = default)
    {
        var existingTour = await GetByIdAsync(tour.Id, cancellationToken);
        if (existingTour == null)
            return null;

        existingTour.Name = tour.Name;
        existingTour.Description = tour.Description;
        existingTour.Destination = tour.Destination;
        existingTour.Price = tour.Price;
        existingTour.DurationDays = tour.DurationDays;
        existingTour.Capacity = tour.Capacity;
        existingTour.AvailableSlots = tour.AvailableSlots;
        existingTour.IsActive = tour.IsActive;
        existingTour.ImageUrl = tour.ImageUrl;
        existingTour.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existingTour;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var tour = await GetByIdAsync(id, cancellationToken);
        if (tour == null)
            return false;

        tour.DeletedAt = DateTime.UtcNow;
        tour.IsActive = false;
        
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tours
            .AnyAsync(t => t.Id == id && t.DeletedAt == null, cancellationToken);
    }
}