namespace VoiceAssistant.Business.DTOs
{
    public class LoginResponseDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; }
        public string Token { get; set; } 
    }
}