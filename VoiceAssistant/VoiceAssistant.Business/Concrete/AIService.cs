using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using VoiceAssistant.Business.Abstract;
using VoiceAssistant.Business.DTOs;
using VoiceAssistant.DataAccess.Contexts;
using VoiceAssistant.DataAccess.Entities;

namespace VoiceAssistant.Business.Concrete
{
    public class AIService : IAIService
    {
        private readonly VoiceAssistantContext _context;
        private readonly HttpClient _httpClient;
        private readonly ICommandProcessingService _commandProcessingService;

        public AIService(VoiceAssistantContext context, HttpClient httpClient, ICommandProcessingService commandProcessingService)
        {
            _context = context;
            _httpClient = httpClient;
            _commandProcessingService = commandProcessingService;
        }

        public async Task<List<ChatLog>> GetUserHistoryAsync(Guid userId)
        {
            return await _context.ChatLogs
                .Where(x => x.AppUserId == userId)
                .OrderByDescending(x => x.CreatedDate)
                .ToListAsync();
        }

        public async Task<AIResponseDto> ProcessVoiceCommandAsync(VoiceCommandDto command)
        {
            var responseDto = new AIResponseDto { Success = false };

            try
            {
                string pythonUrl = "http://localhost:8000/api/process-audio";

                using var content = new MultipartFormDataContent();
                

                var fileStream = command.AudioFile.OpenReadStream();
                content.Add(new StreamContent(fileStream), "file", command.AudioFile.FileName);
                

                content.Add(new StringContent(command.UserId.ToString()), "user_id");


                var pythonResponse = await _httpClient.PostAsync(pythonUrl, content);
                

                pythonResponse.EnsureSuccessStatusCode();


                var result = await pythonResponse.Content.ReadFromJsonAsync<PythonResponseDto>();


                if (result == null) throw new Exception("Python servisi boş cevap döndü.");

                // Komut işleme
                CommandExecutionResult commandResult = null;
                if (!string.IsNullOrEmpty(result.Action) && result.Action != "GENERAL_CHAT")
                {
                    commandResult = await _commandProcessingService.ExecuteCommandAsync(
                        result.Action, 
                        result.Parameters ?? new Dictionary<string, object>(), 
                        command.UserId);
                }

                var chatLog = new ChatLog
                {
                    AppUserId = command.UserId,
                    UserAudioPath = command.AudioFile.FileName,
                    
                    RecognizedText = result.TranscribedText, 
                    AIResponseText = result.LlmResponse,
                    AIAudioPath = "generated_audio.mp3", 
                    
                    IsSuccessful = true,
                    CreatedDate = DateTime.UtcNow
                };

                _context.ChatLogs.Add(chatLog);
                await _context.SaveChangesAsync();

                responseDto.Success = true;
                responseDto.RecognizedText = chatLog.RecognizedText;
                responseDto.AIResponse = chatLog.AIResponseText;
                responseDto.AudioUrl = chatLog.AIAudioPath;
                responseDto.AudioBase64 = result.AudioBase64; // Pass through the base64 audio
                responseDto.Intent = result.Intent;
                responseDto.Action = result.Action;
                responseDto.CommandResult = commandResult;
            }
            catch (Exception ex)
            {
                responseDto.Success = false;
                responseDto.ErrorMessage = $"Hata: {ex.Message}";
            }

            return responseDto;
        }
    }
}