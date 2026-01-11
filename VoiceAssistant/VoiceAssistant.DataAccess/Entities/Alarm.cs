namespace VoiceAssistant.DataAccess.Entities
{
    public class Alarm : BaseEntity
    {
        public Guid AppUserId { get; set; }
        public TimeSpan Time { get; set; }
        public string Label { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        
        // Navigation property
        public AppUser AppUser { get; set; }
    }
}