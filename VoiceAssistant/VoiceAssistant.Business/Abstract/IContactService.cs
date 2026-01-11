namespace VoiceAssistant.Business.Abstract
{
    public interface IContactService
    {
        Task<bool> MakeCallAsync(string contactName, Guid userId);
        Task<ContactDto> FindContactAsync(string contactName, Guid userId);
        Task<List<ContactDto>> GetUserContactsAsync(Guid userId);
    }

    public class ContactDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
        public string Relationship { get; set; } // babam, annem, etc.
    }
}