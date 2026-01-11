import api from './apiService';
import { Alert } from 'react-native';
import { nativeService } from './nativeService';
import { permissionService } from './permissionService';

class CommandService {
  // Alarm işlemleri
  async getAlarms() {
    try {
      const response = await api.get('/command/alarms');
      return response.data;
    } catch (error) {
      console.error('Alarmlar alınırken hata:', error);
      throw error;
    }
  }

  async createAlarm(time, label) {
    try {
      const response = await api.post('/command/alarms', {
        time,
        label
      });
      return response.data;
    } catch (error) {
      console.error('Alarm oluşturulurken hata:', error);
      throw error;
    }
  }

  async deleteAlarm(alarmId) {
    try {
      const response = await api.delete(`/command/alarms/${alarmId}`);
      return response.data;
    } catch (error) {
      console.error('Alarm silinirken hata:', error);
      throw error;
    }
  }

  // Kişi işlemleri
  async getContacts() {
    try {
      const response = await api.get('/command/contacts');
      return response.data;
    } catch (error) {
      console.error('Kişiler alınırken hata:', error);
      throw error;
    }
  }

  async makeCall(contactName) {
    try {
      const response = await api.post('/command/call', {
        contactName
      });
      return response.data;
    } catch (error) {
      console.error('Arama başlatılırken hata:', error);
      throw error;
    }
  }

  // Uygulama işlemleri
  async getInstalledApps() {
    try {
      const response = await api.get('/command/apps');
      return response.data;
    } catch (error) {
      console.error('Uygulamalar alınırken hata:', error);
      throw error;
    }
  }

  async launchApp(appName) {
    try {
      const response = await api.post('/command/launch-app', {
        appName
      });
      return response.data;
    } catch (error) {
      console.error('Uygulama başlatılırken hata:', error);
      throw error;
    }
  }

  // Hava durumu işlemleri
  async getCurrentWeather(location = 'current') {
    try {
      const response = await api.get(`/command/weather?location=${location}`);
      return response.data;
    } catch (error) {
      console.error('Hava durumu alınırken hata:', error);
      throw error;
    }
  }

  async getWeatherForecast(location = 'current', date = 'today') {
    try {
      const response = await api.get(`/command/weather/forecast?location=${location}&date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Hava durumu tahmini alınırken hata:', error);
      throw error;
    }
  }

  // Komut işleme sonuçlarını handle etme
  handleCommandResult(commandResult) {
    if (!commandResult) return;

    console.log('🎯 Komut sonucu işleniyor:', commandResult);
    console.log('🎯 Action:', commandResult.action);

    // Action'a göre işlem yap
    if (commandResult.action === 'CREATE_ALARM') {
      this.handleAlarmCreated(commandResult);
    } else if (commandResult.action === 'MAKE_CALL') {
      this.handleCallInitiated(commandResult);
    } else if (commandResult.action === 'OPEN_APP') {
      this.handleAppLaunch(commandResult);
    } else if (commandResult.action === 'GET_WEATHER') {
      this.handleWeatherInfo(commandResult);
    } else {
      console.log('Bilinmeyen komut sonucu:', commandResult);
    }
  }

  handleAlarmCreated(result) {
    console.log('⏰ handleAlarmCreated çağrıldı:', result);
    
    if (result.success) {
      console.log('✅ Alarm oluşturuldu:', result.message);
      
      // Native alarm oluşturma
      const { time, label } = result.data;
      console.log('⏰ Alarm detayları:', { time, label });
      
      Alert.alert(
        "Alarm Oluştur", 
        `${time} saatinde "${label}" alarmı oluşturulsun mu?`,
        [
          { text: "İptal", style: "cancel" },
          { 
            text: "Oluştur", 
            onPress: async () => {
              console.log('⏰ Kullanıcı alarm oluşturmayı onayladı');
              await nativeService.createAlarm(time, label);
            }
          }
        ]
      );
      
    } else {
      console.log('❌ Alarm oluşturulamadı:', result.errorMessage);
      Alert.alert("Hata", `Alarm oluşturulamadı: ${result.errorMessage}`);
    }
  }

  async handleCallInitiated(result) {
    console.log('📞 handleCallInitiated çağrıldı:', result);
    
    if (result.success) {
      console.log('📞 Arama başlatıldı:', result.message);
      
      // Native call başlat
      const contactName = result.data?.contact_name;
      console.log('📞 Kişi adı:', contactName);
      
      // Gerçek kişilerden telefon numarası bul
      const phoneNumber = await nativeService.findRealContactPhone(contactName);
      console.log('📞 Telefon numarası:', phoneNumber);
      
      if (phoneNumber) {
        // Önce izin kontrol et
        console.log('📞 İzin kontrolü başlatılıyor...');
        this.initiateCallWithPermission(contactName, phoneNumber);
      } else {
        console.log('❌ Telefon numarası bulunamadı');
        Alert.alert("Hata", `${contactName} için telefon numarası bulunamadı. Kişilerinizde "${contactName}" isimli bir kişi var mı?`);
      }
      
    } else {
      console.log('❌ Arama başlatılamadı:', result.errorMessage);
    }
  }

  // İzin kontrolü ile arama başlat
  async initiateCallWithPermission(contactName, phoneNumber) {
    try {
      console.log('📞 İzin kontrol ediliyor...');
      
      // Telefon arama izni kontrol et
      const hasPermission = await permissionService.requestCallPermission();
      
      if (hasPermission) {
        Alert.alert(
          "Arama Yap", 
          `${contactName} (${phoneNumber}) aransın mı?`,
          [
            { text: "İptal", style: "cancel" },
            { 
              text: "Ara", 
              onPress: () => {
                console.log('📞 Arama başlatılıyor:', phoneNumber);
                nativeService.makeCall(phoneNumber);
              }
            }
          ]
        );
      } else {
        console.log('❌ Telefon arama izni yok');
      }
    } catch (error) {
      console.error('Arama izni hatası:', error);
      Alert.alert("Hata", "Arama başlatılamadı");
    }
  }

  handleAppLaunch(result) {
    if (result.success) {
      console.log('🚀 Uygulama açılıyor:', result.message);
      
      // Native app launch
      const appName = result.data?.app_name;
      const packageName = nativeService.getAppPackageName(appName);
      
      if (packageName) {
        Alert.alert(
          "Uygulama Aç", 
          `${appName} uygulaması açılsın mı?`,
          [
            { text: "İptal", style: "cancel" },
            { 
              text: "Aç", 
              onPress: () => nativeService.launchApp(packageName, appName)
            }
          ]
        );
      } else {
        Alert.alert("Hata", `${appName} uygulaması desteklenmiyor`);
      }
      
    } else {
      console.log('❌ Uygulama açılamadı:', result.errorMessage);
    }
  }

  handleWeatherInfo(result) {
    if (result.success) {
      console.log('🌤️ Hava durumu:', result.message);
      // Hava durumu bilgisini UI'da göster
    } else {
      console.log('❌ Hava durumu alınamadı:', result.errorMessage);
    }
  }
}

export const commandService = new CommandService();