using VoiceAssistant.Business.DTOs;
using VoiceAssistant.DataAccess.Entities;

namespace VoiceAssistant.Business.Abstract
{
    public interface IAIService
    {
        Task<AIResponseDto> ProcessVoiceCommandAsync(VoiceCommandDto command);
        

        Task<List<ChatLog>> GetUserHistoryAsync(Guid userId); 
    }
}