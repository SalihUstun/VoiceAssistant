using System.Collections.Generic;

namespace VoiceAssistant.DataAccess.Entities
{
    public class AppUser : BaseEntity
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; } 
        public ICollection<ChatLog> ChatLogs { get; set; }
    }
}