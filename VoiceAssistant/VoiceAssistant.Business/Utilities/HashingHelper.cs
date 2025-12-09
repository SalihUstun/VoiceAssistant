namespace VoiceAssistant.Business.Utilities
{
    public static class HashingHelper
    {
        // Şifreyi hash'ler (Kayıt olurken kullanılır)
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        // Girilen şifre ile hash'i karşılaştırır (Giriş yaparken kullanılır)
        public static bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }
    }
}