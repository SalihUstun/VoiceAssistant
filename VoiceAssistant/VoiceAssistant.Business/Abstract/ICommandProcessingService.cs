using VoiceAssistant.Business.DTOs;

namespace VoiceAssistant.Business.Abstract
{
    public interface ICommandProcessingService
    {
        Task<CommandExecutionResult> ExecuteCommandAsync(string action, Dictionary<string, object> parameters, Guid userId);
        Task<bool> CanExecuteCommandAsync(string action, Guid userId);
    }

    public class CommandExecutionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string ErrorMessage { get; set; }
        public Dictionary<string, object> Data { get; set; }
    }
}