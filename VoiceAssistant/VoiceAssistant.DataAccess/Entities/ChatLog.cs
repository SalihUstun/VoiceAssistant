namespace VoiceAssistant.DataAccess.Entities
{
    public class ChatLog : BaseEntity
    {
        public Guid AppUserId { get; set; }
        public AppUser AppUser { get; set; }
        public string UserAudioPath { get; set; }
        public string RecognizedText { get; set; }


        public string AIResponseText { get; set; } 
        public string AIAudioPath { get; set; } 
        public bool IsSuccessful { get; set; } 
        public string? ErrorMessage { get; set; } 
    }
}