using VoiceAssistant.Business.Abstract;

namespace VoiceAssistant.Business.Concrete
{
    public class CommandProcessingService : ICommandProcessingService
    {
        private readonly IAlarmService _alarmService;
        private readonly IContactService _contactService;
        private readonly IAppLauncherService _appLauncherService;
        private readonly IWeatherService _weatherService;

        public CommandProcessingService(
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

        public async Task<CommandExecutionResult> ExecuteCommandAsync(string action, Dictionary<string, object> parameters, Guid userId)
        {
            try
            {
                switch (action?.ToUpper())
                {
                    case "CREATE_ALARM":
                        return await HandleCreateAlarmAsync(parameters, userId);
                    
                    case "MAKE_CALL":
                        return await HandleMakeCallAsync(parameters, userId);
                    
                    case "OPEN_APP":
                        return await HandleOpenAppAsync(parameters, userId);
                    
                    case "GET_WEATHER":
                        return await HandleGetWeatherAsync(parameters, userId);
                    
                    case "GENERAL_CHAT":
                        return new CommandExecutionResult
                        {
                            Success = true,
                            Message = "Genel sohbet işlendi."
                        };
                    
                    default:
                        return new CommandExecutionResult
                        {
                            Success = false,
                            ErrorMessage = $"Bilinmeyen komut: {action}"
                        };
                }
            }
            catch (Exception ex)
            {
                return new CommandExecutionResult
                {
                    Success = false,
                    ErrorMessage = $"Komut işlenirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<bool> CanExecuteCommandAsync(string action, Guid userId)
        {
            // Basit yetkilendirme kontrolü
            var allowedActions = new[] { "CREATE_ALARM", "MAKE_CALL", "OPEN_APP", "GET_WEATHER", "GENERAL_CHAT" };
            return allowedActions.Contains(action?.ToUpper());
        }

        private async Task<CommandExecutionResult> HandleCreateAlarmAsync(Dictionary<string, object> parameters, Guid userId)
        {
            try
            {
                var time = parameters.GetValueOrDefault("time")?.ToString() ?? "08:00";
                var label = parameters.GetValueOrDefault("label")?.ToString() ?? "Alarm";

                var success = await _alarmService.CreateAlarmAsync(time, label, userId);
                
                return new CommandExecutionResult
                {
                    Success = success,
                    Message = success ? $"Alarm başarıyla oluşturuldu: {time} - {label}" : "Alarm oluşturulamadı",
                    Data = new Dictionary<string, object>
                    {
                        ["time"] = time,
                        ["label"] = label
                    }
                };
            }
            catch (Exception ex)
            {
                return new CommandExecutionResult
                {
                    Success = false,
                    ErrorMessage = $"Alarm oluşturulurken hata: {ex.Message}"
                };
            }
        }

        private async Task<CommandExecutionResult> HandleMakeCallAsync(Dictionary<string, object> parameters, Guid userId)
        {
            try
            {
                var contactName = parameters.GetValueOrDefault("contact_name")?.ToString();
                
                if (string.IsNullOrEmpty(contactName))
                {
                    return new CommandExecutionResult
                    {
                        Success = false,
                        ErrorMessage = "Kişi adı belirtilmedi"
                    };
                }

                var success = await _contactService.MakeCallAsync(contactName, userId);
                
                return new CommandExecutionResult
                {
                    Success = success,
                    Message = success ? $"{contactName} aranıyor..." : "Arama başlatılamadı",
                    Data = new Dictionary<string, object>
                    {
                        ["contact_name"] = contactName
                    }
                };
            }
            catch (Exception ex)
            {
                return new CommandExecutionResult
                {
                    Success = false,
                    ErrorMessage = $"Arama başlatılırken hata: {ex.Message}"
                };
            }
        }

        private async Task<CommandExecutionResult> HandleOpenAppAsync(Dictionary<string, object> parameters, Guid userId)
        {
            try
            {
                var appName = parameters.GetValueOrDefault("app_name")?.ToString();
                
                if (string.IsNullOrEmpty(appName))
                {
                    return new CommandExecutionResult
                    {
                        Success = false,
                        ErrorMessage = "Uygulama adı belirtilmedi"
                    };
                }

                var success = await _appLauncherService.LaunchAppAsync(appName, userId);
                
                return new CommandExecutionResult
                {
                    Success = success,
                    Message = success ? $"{appName} uygulaması açılıyor..." : "Uygulama açılamadı",
                    Data = new Dictionary<string, object>
                    {
                        ["app_name"] = appName
                    }
                };
            }
            catch (Exception ex)
            {
                return new CommandExecutionResult
                {
                    Success = false,
                    ErrorMessage = $"Uygulama açılırken hata: {ex.Message}"
                };
            }
        }

        private async Task<CommandExecutionResult> HandleGetWeatherAsync(Dictionary<string, object> parameters, Guid userId)
        {
            try
            {
                var location = parameters.GetValueOrDefault("location")?.ToString() ?? "current";
                var date = parameters.GetValueOrDefault("date")?.ToString() ?? "today";

                WeatherDto weather;
                if (date == "today")
                {
                    weather = await _weatherService.GetCurrentWeatherAsync(location);
                }
                else
                {
                    weather = await _weatherService.GetWeatherForecastAsync(location, date);
                }
                
                return new CommandExecutionResult
                {
                    Success = weather != null,
                    Message = weather != null ? 
                        $"{weather.Location} için hava durumu: {weather.Temperature}, {weather.Description}" : 
                        "Hava durumu bilgisi alınamadı",
                    Data = weather != null ? new Dictionary<string, object>
                    {
                        ["weather"] = weather
                    } : null
                };
            }
            catch (Exception ex)
            {
                return new CommandExecutionResult
                {
                    Success = false,
                    ErrorMessage = $"Hava durumu alınırken hata: {ex.Message}"
                };
            }
        }
    }
}