using Microsoft.AspNetCore.Http;

namespace VoiceAssistant.Business.DTOs
{
    public class VoiceCommandDto
    {
        public Guid UserId { get; set; } 
        public IFormFile AudioFile { get; set; } 
    }
}