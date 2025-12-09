namespace VoiceAssistant.Business.DTOs
{
    public class AIResponseDto
    {
        public bool Success { get; set; }
        public string RecognizedText { get; set; } 
        public string AIResponse { get; set; }     
        public string AudioUrl { get; set; }       
        public string ErrorMessage { get; set; }
    }
}