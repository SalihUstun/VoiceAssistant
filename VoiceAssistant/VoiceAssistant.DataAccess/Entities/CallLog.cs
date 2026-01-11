namespace VoiceAssistant.DataAccess.Entities
{
    public class CallLog : BaseEntity
    {
        public Guid AppUserId { get; set; }
        public string ContactName { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime CallDate { get; set; }
        public bool IsSuccessful { get; set; }
        
        // Navigation property
        public AppUser AppUser { get; set; }
    }
}