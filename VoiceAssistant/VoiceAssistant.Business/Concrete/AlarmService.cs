using VoiceAssistant.Business.Abstract;
using VoiceAssistant.DataAccess.Contexts;
using VoiceAssistant.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace VoiceAssistant.Business.Concrete
{
    public class AlarmService : IAlarmService
    {
        private readonly VoiceAssistantContext _context;

        public AlarmService(VoiceAssistantContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateAlarmAsync(string time, string label, Guid userId)
        {
            try
            {
                // Time validation
                if (!TimeSpan.TryParse(time, out var alarmTime))
                {
                    return false;
                }

                var alarm = new Alarm
                {
                    AppUserId = userId,
                    Time = alarmTime,
                    Label = label,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Alarms.Add(alarm);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> DeleteAlarmAsync(Guid alarmId, Guid userId)
        {
            try
            {
                var alarm = await _context.Alarms
                    .FirstOrDefaultAsync(a => a.Id == alarmId && a.AppUserId == userId);

                if (alarm == null) return false;

                _context.Alarms.Remove(alarm);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<List<AlarmDto>> GetUserAlarmsAsync(Guid userId)
        {
            try
            {
                var alarms = await _context.Alarms
                    .Where(a => a.AppUserId == userId && a.IsActive)
                    .OrderBy(a => a.Time)
                    .Select(a => new AlarmDto
                    {
                        Id = a.Id,
                        Time = a.Time.ToString(@"hh\:mm"),
                        Label = a.Label,
                        IsActive = a.IsActive,
                        CreatedDate = a.CreatedDate
                    })
                    .ToListAsync();

                return alarms;
            }
            catch (Exception)
            {
                return new List<AlarmDto>();
            }
        }
    }
}