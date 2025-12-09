using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAssistant.Business.Abstract;
using VoiceAssistant.Business.DTOs;

namespace VoiceAssistant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AssistantController : ControllerBase
    {
        private readonly IAIService _aiService;

        public AssistantController(IAIService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("send-audio")]
        public async Task<IActionResult> SendAudio([FromForm] VoiceCommandDto request)
        {
            var result = await _aiService.ProcessVoiceCommandAsync(request);

            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
    }
}