namespace VoiceAssistant.Business.Abstract
{
    public interface IAlarmService
    {
        Task<bool> CreateAlarmAsync(string time, string label, Guid userId);
        Task<bool> DeleteAlarmAsync(Guid alarmId, Guid userId);
        Task<List<AlarmDto>> GetUserAlarmsAsync(Guid userId);
    }

    public class AlarmDto
    {
        public Guid Id { get; set; }
        public string Time { get; set; }
        public string Label { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}