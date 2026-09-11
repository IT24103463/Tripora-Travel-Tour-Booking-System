using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.TourService.Data;
using Tripora.TourService.Models;

namespace Tripora.TourService.Controllers;

[ApiController]
[Route("api/hotels")]
public class HotelController : ControllerBase
{
    private readonly TourDbContext _context;

    public HotelController(TourDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllHotels()
    {
        var hotels = await _context.Hotels.Where(h => h.IsActive).ToListAsync();
        return Ok(hotels);
    }
}

