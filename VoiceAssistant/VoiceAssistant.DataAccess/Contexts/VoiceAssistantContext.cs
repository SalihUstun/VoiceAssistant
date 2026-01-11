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
        public DbSet<Alarm> Alarms { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<CallLog> CallLogs { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // AppUser relationships
            modelBuilder.Entity<AppUser>()
                .HasMany(u => u.ChatLogs)
                .WithOne(c => c.AppUser)
                .HasForeignKey(c => c.AppUserId);

            // Alarm relationships
            modelBuilder.Entity<Alarm>()
                .HasOne(a => a.AppUser)
                .WithMany()
                .HasForeignKey(a => a.AppUserId);

            // Contact relationships
            modelBuilder.Entity<Contact>()
                .HasOne(c => c.AppUser)
                .WithMany()
                .HasForeignKey(c => c.AppUserId);

            // CallLog relationships
            modelBuilder.Entity<CallLog>()
                .HasOne(cl => cl.AppUser)
                .WithMany()
                .HasForeignKey(cl => cl.AppUserId);

            base.OnModelCreating(modelBuilder);
        }
    }
}