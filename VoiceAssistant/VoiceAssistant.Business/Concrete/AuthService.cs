using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using VoiceAssistant.Business.Abstract;
using VoiceAssistant.Business.DTOs;
using VoiceAssistant.Business.Utilities;
using VoiceAssistant.DataAccess.Contexts;
using VoiceAssistant.DataAccess.Entities;

namespace VoiceAssistant.Business.Concrete
{
    public class AuthService : IAuthService
    {
        private readonly VoiceAssistantContext _context;
        private readonly JwtHelper _jwtHelper;

        public AuthService(VoiceAssistantContext context, IConfiguration configuration)
        {
            _context = context;
            _jwtHelper = new JwtHelper(configuration);
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginDto model)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Username == model.Username);

            if (user == null)
                return null;

            bool isPasswordValid = HashingHelper.VerifyPassword(model.Password, user.PasswordHash);

            if (!isPasswordValid)
                return null; 


            string token = _jwtHelper.GenerateToken(user);
            
            return new LoginResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Token = token
            };
        }

        public async Task<bool> RegisterAsync(RegisterDto model)
        {
            if (await _context.Users.AnyAsync(x => x.Username == model.Username))
                return false;
            
            string passwordHash = HashingHelper.HashPassword(model.Password);

            var newUser = new AppUser
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                Username = model.Username,
                Email = model.Email,
                PasswordHash = passwordHash 
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}