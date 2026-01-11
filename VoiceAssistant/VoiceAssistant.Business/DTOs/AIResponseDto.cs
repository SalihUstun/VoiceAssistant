using VoiceAssistant.Business.Abstract;

namespace VoiceAssistant.Business.DTOs
{
    public class AIResponseDto
    {
        public bool Success { get; set; }
        public string RecognizedText { get; set; } 
        public string AIResponse { get; set; }     
        public string AudioUrl { get; set; }
        public string AudioBase64 { get; set; }       
        public string ErrorMessage { get; set; }
        public string Intent { get; set; }
        public string Action { get; set; }
        public CommandExecutionResult CommandResult { get; set; }
    }
}