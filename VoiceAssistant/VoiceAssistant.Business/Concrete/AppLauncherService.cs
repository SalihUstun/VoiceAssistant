using VoiceAssistant.Business.Abstract;

namespace VoiceAssistant.Business.Concrete
{
    public class AppLauncherService : IAppLauncherService
    {
        public async Task<bool> LaunchAppAsync(string appName, Guid userId)
        {
            try
            {
                var app = await FindAppByNameAsync(appName, userId);
                
                if (app != null)
                {
                    // Burada gerçek uygulama başlatma işlemi yapılacak
                    // React Native tarafından native modül ile yapılacak
                    Console.WriteLine($"Uygulama başlatılıyor: {app.DisplayName} ({app.PackageName})");
                    
                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<List<AppDto>> GetInstalledAppsAsync(Guid userId)
        {
            // Bu method gerçek implementasyonda cihazdan yüklü uygulamaları alacak
            // Şimdilik demo uygulamalar döndürüyoruz
            await Task.Delay(100); // Simulate async operation

            return new List<AppDto>
            {
                new AppDto { PackageName = "com.whatsapp", DisplayName = "WhatsApp", IsSystemApp = false },
                new AppDto { PackageName = "com.instagram.android", DisplayName = "Instagram", IsSystemApp = false },
                new AppDto { PackageName = "com.spotify.music", DisplayName = "Spotify", IsSystemApp = false },
                new AppDto { PackageName = "com.google.android.youtube", DisplayName = "YouTube", IsSystemApp = false },
                new AppDto { PackageName = "com.android.chrome", DisplayName = "Chrome", IsSystemApp = false },
                new AppDto { PackageName = "com.google.android.gm", DisplayName = "Gmail", IsSystemApp = false },
                new AppDto { PackageName = "com.android.settings", DisplayName = "Ayarlar", IsSystemApp = true },
                new AppDto { PackageName = "com.android.camera2", DisplayName = "Kamera", IsSystemApp = true }
            };
        }

        public async Task<AppDto> FindAppByNameAsync(string appName, Guid userId)
        {
            try
            {
                var installedApps = await GetInstalledAppsAsync(userId);
                
                // Türkçe uygulama adları için mapping
                var appNameMappings = new Dictionary<string, string>
                {
                    ["whatsapp"] = "WhatsApp",
                    ["instagram"] = "Instagram",
                    ["spotify"] = "Spotify",
                    ["youtube"] = "YouTube",
                    ["chrome"] = "Chrome",
                    ["gmail"] = "Gmail",
                    ["ayarlar"] = "Ayarlar",
                    ["kamera"] = "Kamera",
                    ["müzik"] = "Spotify",
                    ["video"] = "YouTube",
                    ["tarayıcı"] = "Chrome",
                    ["mail"] = "Gmail"
                };

                var normalizedAppName = appName.ToLower().Trim();
                
                // Önce mapping'den kontrol et
                if (appNameMappings.ContainsKey(normalizedAppName))
                {
                    var mappedName = appNameMappings[normalizedAppName];
                    return installedApps.FirstOrDefault(app => 
                        app.DisplayName.ToLower().Contains(mappedName.ToLower()));
                }

                // Direkt isim eşleşmesi
                return installedApps.FirstOrDefault(app => 
                    app.DisplayName.ToLower().Contains(normalizedAppName) ||
                    app.PackageName.ToLower().Contains(normalizedAppName));
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}