namespace VoiceAssistant.Business.Abstract
{
    public interface IAppLauncherService
    {
        Task<bool> LaunchAppAsync(string appName, Guid userId);
        Task<List<AppDto>> GetInstalledAppsAsync(Guid userId);
        Task<AppDto> FindAppByNameAsync(string appName, Guid userId);
    }

    public class AppDto
    {
        public string PackageName { get; set; }
        public string DisplayName { get; set; }
        public string Icon { get; set; }
        public bool IsSystemApp { get; set; }
    }
}