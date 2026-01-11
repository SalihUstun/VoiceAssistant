using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoiceAssistant.Business.Abstract;
using System.Security.Claims;

namespace VoiceAssistant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CommandController : ControllerBase
    {
        private readonly IAlarmService _alarmService;
        private readonly IContactService _contactService;
        private readonly IAppLauncherService _appLauncherService;
        private readonly IWeatherService _weatherService;

        public CommandController(
            IAlarmService alarmService,
            IContactService contactService,
            IAppLauncherService appLauncherService,
            IWeatherService weatherService)
        {
            _alarmService = alarmService;
            _contactService = contactService;
            _appLauncherService = appLauncherService;
            _weatherService = weatherService;
        }

        [HttpGet("alarms")]
        public async Task<IActionResult> GetAlarms()
        {
            var userId = GetCurrentUserId();
            var alarms = await _alarmService.GetUserAlarmsAsync(userId);
            return Ok(alarms);
        }

        [HttpPost("alarms")]
        public async Task<IActionResult> CreateAlarm([FromBody] CreateAlarmRequest request)
        {
            var userId = GetCurrentUserId();
            var success = await _alarmService.CreateAlarmAsync(request.Time, request.Label, userId);
            
            if (success)
                return Ok(new { message = "Alarm başarıyla oluşturuldu" });
            
            return BadRequest(new { message = "Alarm oluşturulamadı" });
        }

        [HttpDelete("alarms/{alarmId}")]
        public async Task<IActionResult> DeleteAlarm(Guid alarmId)
        {
            var userId = GetCurrentUserId();
            var success = await _alarmService.DeleteAlarmAsync(alarmId, userId);
            
            if (success)
                return Ok(new { message = "Alarm silindi" });
            
            return BadRequest(new { message = "Alarm silinemedi" });
        }

        [HttpGet("contacts")]
        public async Task<IActionResult> GetContacts()
        {
            var userId = GetCurrentUserId();
            var contacts = await _contactService.GetUserContactsAsync(userId);
            return Ok(contacts);
        }

        [HttpPost("call")]
        public async Task<IActionResult> MakeCall([FromBody] MakeCallRequest request)
        {
            var userId = GetCurrentUserId();
            var success = await _contactService.MakeCallAsync(request.ContactName, userId);
            
            if (success)
                return Ok(new { message = $"{request.ContactName} aranıyor..." });
            
            return BadRequest(new { message = "Arama başlatılamadı" });
        }

        [HttpGet("apps")]
        public async Task<IActionResult> GetInstalledApps()
        {
            var userId = GetCurrentUserId();
            var apps = await _appLauncherService.GetInstalledAppsAsync(userId);
            return Ok(apps);
        }

        [HttpPost("launch-app")]
        public async Task<IActionResult> LaunchApp([FromBody] LaunchAppRequest request)
        {
            var userId = GetCurrentUserId();
            var success = await _appLauncherService.LaunchAppAsync(request.AppName, userId);
            
            if (success)
                return Ok(new { message = $"{request.AppName} uygulaması açılıyor..." });
            
            return BadRequest(new { message = "Uygulama açılamadı" });
        }

        [HttpGet("weather")]
        public async Task<IActionResult> GetWeather([FromQuery] string location = "current")
        {
            var weather = await _weatherService.GetCurrentWeatherAsync(location);
            
            if (weather != null)
                return Ok(weather);
            
            return BadRequest(new { message = "Hava durumu bilgisi alınamadı" });
        }

        [HttpGet("weather/forecast")]
        public async Task<IActionResult> GetWeatherForecast([FromQuery] string location = "current", [FromQuery] string date = "today")
        {
            var weather = await _weatherService.GetWeatherForecastAsync(location, date);
            
            if (weather != null)
                return Ok(weather);
            
            return BadRequest(new { message = "Hava durumu tahmini alınamadı" });
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }

    public class CreateAlarmRequest
    {
        public string Time { get; set; }
        public string Label { get; set; }
    }

    public class MakeCallRequest
    {
        public string ContactName { get; set; }
    }

    public class LaunchAppRequest
    {
        public string AppName { get; set; }
    }
}