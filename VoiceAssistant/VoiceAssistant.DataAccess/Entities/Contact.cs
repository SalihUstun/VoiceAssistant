namespace VoiceAssistant.DataAccess.Entities
{
    public class Contact : BaseEntity
    {
        public Guid AppUserId { get; set; }
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
        public string Relationship { get; set; } // babam, annem, etc.
        public DateTime CreatedDate { get; set; }
        
        // Navigation property
        public AppUser AppUser { get; set; }
    }
}