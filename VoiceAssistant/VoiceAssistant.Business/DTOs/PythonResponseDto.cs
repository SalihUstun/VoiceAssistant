using System.Text.Json.Serialization;

namespace VoiceAssistant.Business.DTOs
{
    public class PythonResponseDto
    {
        [JsonPropertyName("transcribedText")]
        public string TranscribedText { get; set; }

        [JsonPropertyName("llmResponse")]
        public string LlmResponse { get; set; }

        [JsonPropertyName("audioBase64")]
        public string AudioBase64 { get; set; }

        [JsonPropertyName("intent")]
        public string Intent { get; set; }

        [JsonPropertyName("entities")]
        public Dictionary<string, object> Entities { get; set; }

        [JsonPropertyName("action")]
        public string Action { get; set; }

        [JsonPropertyName("parameters")]
        public Dictionary<string, object> Parameters { get; set; }
    }
}