using Microsoft.AspNetCore.Mvc;
using VoiceAssistant.Business.Abstract;

namespace VoiceAssistant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoryController : ControllerBase
    {
        private readonly IAIService _aiService;

        public HistoryController(IAIService aiService)
        {
            _aiService = aiService;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetHistory(Guid userId) 
        {
            var logs = await _aiService.GetUserHistoryAsync(userId);
            return Ok(logs);
        }
    }
}