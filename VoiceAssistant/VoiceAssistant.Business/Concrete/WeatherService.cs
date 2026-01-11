using VoiceAssistant.Business.Abstract;
using System.Text.Json;

namespace VoiceAssistant.Business.Concrete
{
    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey = "your_openweather_api_key"; // OpenWeatherMap API key

        public WeatherService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<WeatherDto> GetCurrentWeatherAsync(string location = "current")
        {
            try
            {
                // Demo amaçlı sabit veri döndürüyoruz
                // Gerçek implementasyonda OpenWeatherMap API kullanılacak
                
                if (location == "current")
                {
                    location = "İstanbul"; // Default location
                }

                // Simulate API call delay
                await Task.Delay(500);

                return new WeatherDto
                {
                    Location = location,
                    Temperature = "22°C",
                    Description = "Parçalı bulutlu",
                    Humidity = "%65",
                    WindSpeed = "15 km/h",
                    Date = DateTime.Now
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<WeatherDto> GetWeatherForecastAsync(string location, string date)
        {
            try
            {
                if (location == "current")
                {
                    location = "İstanbul";
                }

                // Simulate API call delay
                await Task.Delay(500);

                var temperature = date == "tomorrow" ? "25°C" : "20°C";
                var description = date == "tomorrow" ? "Güneşli" : "Yağmurlu";

                return new WeatherDto
                {
                    Location = location,
                    Temperature = temperature,
                    Description = description,
                    Humidity = "%60",
                    WindSpeed = "12 km/h",
                    Date = date == "tomorrow" ? DateTime.Now.AddDays(1) : DateTime.Now
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        // Gerçek API implementasyonu için örnek method
        private async Task<WeatherDto> GetWeatherFromApiAsync(string location)
        {
            try
            {
                var url = $"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={_apiKey}&units=metric&lang=tr";
                
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                
                var jsonContent = await response.Content.ReadAsStringAsync();
                var weatherData = JsonSerializer.Deserialize<JsonElement>(jsonContent);

                return new WeatherDto
                {
                    Location = weatherData.GetProperty("name").GetString(),
                    Temperature = $"{weatherData.GetProperty("main").GetProperty("temp").GetDouble():F0}°C",
                    Description = weatherData.GetProperty("weather")[0].GetProperty("description").GetString(),
                    Humidity = $"%{weatherData.GetProperty("main").GetProperty("humidity").GetInt32()}",
                    WindSpeed = $"{weatherData.GetProperty("wind").GetProperty("speed").GetDouble():F0} km/h",
                    Date = DateTime.Now
                };
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}