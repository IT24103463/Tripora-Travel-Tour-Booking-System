using Tripora.TourService.Models;

namespace Tripora.TourService.Repositories;

public interface ITourRepository
{
    Task<Tour?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<List<Tour>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Tour>> GetActiveToursAsync(CancellationToken cancellationToken = default);
    Task<Tour> CreateAsync(Tour tour, CancellationToken cancellationToken = default);
    Task<Tour?> UpdateAsync(Tour tour, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default);
}