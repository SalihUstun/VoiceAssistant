using Microsoft.AspNetCore.Mvc;
using VoiceAssistant.Business.Abstract;
using VoiceAssistant.Business.DTOs;

namespace VoiceAssistant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            var result = await _authService.RegisterAsync(request);
            if (result)
                return Ok(new { message = "Kullanıcı başarıyla oluşturuldu." });
            
            return BadRequest(new { message = "Bu kullanıcı adı zaten kullanılıyor." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var result = await _authService.LoginAsync(request);

            if (result == null)
                return Unauthorized(new { message = "Kullanıcı adı veya şifre hatalı." });

            return Ok(new { 
                message = "Giriş başarılı", 
                userId = result.UserId,    
                username = result.Username, 
                token = result.Token       
            });
        }
    }
}