using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Controllers;

[ApiController]
[Route("api/hotels")]
public class HotelController : ControllerBase
{
    private readonly DestinationDbContext _context;

    public HotelController(DestinationDbContext context)
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

