using Microsoft.EntityFrameworkCore;
using VoiceAssistant.DataAccess.Entities;

namespace VoiceAssistant.DataAccess.Contexts
{
    public class VoiceAssistantContext : DbContext
    {

        public VoiceAssistantContext(DbContextOptions<VoiceAssistantContext> options) : base(options)
        {
        }
        
        public DbSet<AppUser> Users { get; set; }
        public DbSet<ChatLog> ChatLogs { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<AppUser>()
                .HasMany(u => u.ChatLogs)
                .WithOne(c => c.AppUser)
                .HasForeignKey(c => c.AppUserId);

            base.OnModelCreating(modelBuilder);
        }
    }
}