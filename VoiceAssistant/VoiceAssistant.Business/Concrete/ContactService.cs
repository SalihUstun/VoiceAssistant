using VoiceAssistant.Business.Abstract;
using VoiceAssistant.DataAccess.Contexts;
using VoiceAssistant.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace VoiceAssistant.Business.Concrete
{
    public class ContactService : IContactService
    {
        private readonly VoiceAssistantContext _context;

        public ContactService(VoiceAssistantContext context)
        {
            _context = context;
        }

        public async Task<bool> MakeCallAsync(string contactName, Guid userId)
        {
            try
            {
                var contact = await FindContactAsync(contactName, userId);
                
                if (contact == null)
                {
                    // Eğer kişi bulunamazsa, default kişileri kontrol et
                    contact = GetDefaultContact(contactName);
                }

                if (contact != null)
                {
                    // Burada gerçek arama işlemi yapılacak
                    // Şimdilik sadece log kaydı yapıyoruz
                    Console.WriteLine($"Arama başlatılıyor: {contact.Name} - {contact.PhoneNumber}");
                    
                    // Arama geçmişi kaydı
                    var callLog = new CallLog
                    {
                        AppUserId = userId,
                        ContactName = contact.Name,
                        PhoneNumber = contact.PhoneNumber,
                        CallDate = DateTime.UtcNow,
                        IsSuccessful = true
                    };

                    _context.CallLogs.Add(callLog);
                    await _context.SaveChangesAsync();

                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<ContactDto> FindContactAsync(string contactName, Guid userId)
        {
            try
            {
                var contact = await _context.Contacts
                    .FirstOrDefaultAsync(c => c.AppUserId == userId && 
                        (c.Name.ToLower().Contains(contactName.ToLower()) || 
                         c.Relationship.ToLower() == contactName.ToLower()));

                if (contact != null)
                {
                    return new ContactDto
                    {
                        Id = contact.Id,
                        Name = contact.Name,
                        PhoneNumber = contact.PhoneNumber,
                        Relationship = contact.Relationship
                    };
                }

                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<ContactDto>> GetUserContactsAsync(Guid userId)
        {
            try
            {
                var contacts = await _context.Contacts
                    .Where(c => c.AppUserId == userId)
                    .Select(c => new ContactDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        PhoneNumber = c.PhoneNumber,
                        Relationship = c.Relationship
                    })
                    .ToListAsync();

                return contacts;
            }
            catch (Exception)
            {
                return new List<ContactDto>();
            }
        }

        private ContactDto GetDefaultContact(string contactName)
        {
            // Default kişiler (demo amaçlı)
            var defaultContacts = new Dictionary<string, ContactDto>
            {
                ["babam"] = new ContactDto { Name = "Baba", PhoneNumber = "+90555000001", Relationship = "babam" },
                ["annem"] = new ContactDto { Name = "Anne", PhoneNumber = "+90555000002", Relationship = "annem" },
                ["kardeşim"] = new ContactDto { Name = "Kardeş", PhoneNumber = "+90555000003", Relationship = "kardeşim" },
                ["eşim"] = new ContactDto { Name = "Eş", PhoneNumber = "+90555000004", Relationship = "eşim" }
            };

            return defaultContacts.GetValueOrDefault(contactName.ToLower());
        }
    }
}