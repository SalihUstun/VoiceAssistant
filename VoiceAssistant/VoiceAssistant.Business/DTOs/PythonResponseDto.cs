namespace VoiceAssistant.Business.DTOs
{
    public class PythonResponseDto
    {
        public string TranscribedText { get; set; } 
        public string LlmResponse { get; set; }    
        public string AudioBase64 { get; set; }     
    }
}