namespace VoiceAssistant.Business.Abstract
{
    public interface IWeatherService
    {
        Task<WeatherDto> GetCurrentWeatherAsync(string location = "current");
        Task<WeatherDto> GetWeatherForecastAsync(string location, string date);
    }

    public class WeatherDto
    {
        public string Location { get; set; }
        public string Temperature { get; set; }
        public string Description { get; set; }
        public string Humidity { get; set; }
        public string WindSpeed { get; set; }
        public DateTime Date { get; set; }
    }
}