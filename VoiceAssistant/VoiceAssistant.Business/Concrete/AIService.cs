using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json; // JSON okumak için gerekli
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

        public AIService(VoiceAssistantContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
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