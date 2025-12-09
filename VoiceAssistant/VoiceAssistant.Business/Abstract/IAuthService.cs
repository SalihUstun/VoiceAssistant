using VoiceAssistant.Business.DTOs;
using VoiceAssistant.DataAccess.Entities;

namespace VoiceAssistant.Business.Abstract
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(RegisterDto model);
        Task<LoginResponseDto?> LoginAsync(LoginDto model);
        
    }
}