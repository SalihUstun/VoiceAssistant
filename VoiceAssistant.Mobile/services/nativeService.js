import { Linking, Alert, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { contactsService } from './contactsService';

class NativeService {
  

  async createAlarm(time, label) {
    try {
      console.log(`  Native alarm oluşturuluyor: ${time} - ${label}`);
      
      const [hours, minutes] = time.split(':').map(num => parseInt(num));
      console.log(`  Parsed time: ${hours}:${minutes}`);

      if (Platform.OS === 'ios') {
        await this.createAlarmIOS(hours, minutes, label);
        return;
      }

      if (Platform.OS === 'android') {
        const methods = [
          () => this.createAlarmWithIntent(hours, minutes, label),
          () => this.createAlarmWithProvider(hours, minutes, label),
          () => this.openClockAppWithTime(hours, minutes, label)
        ];
        
        for (let i = 0; i < methods.length; i++) {
          try {
            console.log(`  Yöntem ${i + 1} deneniyor...`);
            await methods[i]();
            console.log(`   Yöntem ${i + 1} başarılı!`);
            return;
          } catch (error) {
            console.log(`   Yöntem ${i + 1} başarısız:`, error.message);
            if (i === methods.length - 1) {
              throw error;
            }
          }
        }
      }
    } catch (error) {
      console.error('   Tüm alarm yöntemleri başarısız:', error);
      Alert.alert('Hata', `Alarm oluşturulamadı. Lütfen manuel olarak saat uygulamasından ${time} için alarm kurun.`);
    }
  }
  
  // iOS'ta üçüncü parti uygulamaların alarm kurmasına izin veren bir API yok.
  // Apple'ın Saat uygulamasını "clock-alarm://" şemasıyla açıp kullanıcıya saati gösteriyoruz.
  async createAlarmIOS(hours, minutes, label) {
    const timeText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const clockUrl = 'clock-alarm://';

    const supported = await Linking.canOpenURL(clockUrl);
    if (supported) {
      await Linking.openURL(clockUrl);
      setTimeout(() => {
        Alert.alert(
          'Saat Uygulaması Açıldı',
          `Lütfen ${timeText} için "${label}" alarmını kurun.`,
          [{ text: 'Tamam' }]
        );
      }, 1500);
      return;
    }

    Alert.alert(
      'Alarm',
      `iOS'ta alarm otomatik kurulamıyor. Lütfen Saat uygulamasından ${timeText} için "${label}" alarmını kurun.`
    );
  }

  async createAlarmWithIntent(hours, minutes, label) {
    const alarmIntent = {
      action: 'android.intent.action.SET_ALARM',
      extra: {
        'android.intent.extra.alarm.HOUR': hours,
        'android.intent.extra.alarm.MINUTES': minutes,
        'android.intent.extra.alarm.MESSAGE': label,
        'android.intent.extra.alarm.SKIP_UI': false
      }
    };
    
    await IntentLauncher.startActivityAsync('android.intent.action.SET_ALARM', alarmIntent);
  }
  
  async createAlarmWithProvider(hours, minutes, label) {
    const alarmUri = `content://com.android.calendar/time/${Date.now()}`;
    const alarmUrl = `alarmclock://set?hour=${hours}&minute=${minutes}&message=${encodeURIComponent(label)}`;
    
    const supported = await Linking.canOpenURL(alarmUrl);
    if (supported) {
      await Linking.openURL(alarmUrl);
    } else {
      throw new Error('AlarmClock provider desteklenmiyor');
    }
  }
  
  async openClockAppWithTime(hours, minutes, label) {
    try {
      console.log(`  Clock app açılıyor: ${hours}:${minutes} - ${label}`);
      
      const clockUrls = [
        `android-app://com.google.android.deskclock/timer?hour=${hours}&minute=${minutes}`,
        `android-app://com.google.android.deskclock`,
        `android-app://com.android.deskclock`,
        `android-app://com.samsung.android.app.clockpackage`,
        `android-app://com.sec.android.app.clockpackage`,
        `android-app://com.htc.android.worldclock`
      ];
      
      for (const url of clockUrls) {
        try {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            console.log(`   Clock app açılıyor: ${url}`);
            await Linking.openURL(url);
            

            setTimeout(() => {
              Alert.alert(
                "Saat Uygulaması Açıldı", 
                `Saat uygulaması açıldı. Lütfen ${hours}:${minutes.toString().padStart(2, '0')} için "${label}" alarmını kurun.`,
                [{ text: "Tamam" }]
              );
            }, 1500);
            
            return;
          }
        } catch (error) {
          console.log(`   URL başarısız: ${url}`);
          continue;
        }
      }
      
      throw new Error('Hiçbir saat uygulaması bulunamadı');
      
    } catch (error) {
      console.error('Clock app açma hatası:', error);
      Alert.alert(
        'Saat Uygulaması Bulunamadı', 
        `Lütfen telefonunuzun saat uygulamasından ${hours}:${minutes.toString().padStart(2, '0')} için "${label}" alarmını manuel olarak kurun.`
      );
    }
  }
  
  async openClockApp() {
    if (Platform.OS === 'ios') {
      try { await Linking.openURL('clock-alarm://'); } catch (e) { Alert.alert('Bilgi', 'Saat uygulaması açılamadı'); }
      return;
    }

    const clockUrls = [
      'android-app://com.google.android.deskclock',
      'android-app://com.android.deskclock',
      'android-app://com.samsung.android.app.clockpackage'
    ];
    
    for (const url of clockUrls) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    Alert.alert('Bilgi', 'Saat uygulaması bulunamadı');
  }
  
  async makeCall(phoneNumber) {
    try {
      console.log(`  Native arama başlatılıyor: ${phoneNumber}`);
      
      // iOS'ta telprompt: aramadan önce onay diyaloğu gösterir, Android'de tel: kullanılır
      const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
      console.log(`  Arama URL'si: ${url}`);

      if (Platform.OS === 'ios') {
        // canOpenURL iOS simülatöründe her zaman false döner; gerçek cihazda tel: desteklenir
        await Linking.openURL(url);
        console.log('   Arama başlatıldı (iOS)');
        return;
      }
      
      const supported = await Linking.canOpenURL(url);
      console.log(`  URL destekleniyor mu: ${supported}`);
      
      if (supported) {
        console.log('  Linking.openURL çağrılıyor...');
        await Linking.openURL(url);
        console.log('   Arama başlatıldı');
      } else {
        console.log('   Tel URL desteklenmiyor');
        Alert.alert('Hata', 'Arama özelliği desteklenmiyor');
      }
    } catch (error) {
      console.error('   Arama hatası:', error);
      Alert.alert('Hata', `Arama başlatılamadı: ${error.message}`);
    }
  }
  
  async launchApp(packageName, appName) {
    try {
      console.log(`   Uygulama başlatılıyor: ${appName} (${packageName})`);

      if (Platform.OS === 'ios') {
        // iOS'ta packageName aslında URL şemasıdır (bkz. getAppIdentifier)
        const appUrl = packageName.includes('://') ? packageName : `${packageName}://`;
        const supported = await Linking.canOpenURL(appUrl);
        if (supported) {
          await Linking.openURL(appUrl);
          console.log('   Uygulama başlatıldı (iOS)');
        } else {
          Alert.alert('Uygulama Bulunamadı', `${appName} yüklü değil veya URL şeması Info.plist'e eklenmemiş.`);
        }
        return;
      }
      
      if (Platform.OS === 'android') {
        const appUrl = `android-app://${packageName}`;
        const supported = await Linking.canOpenURL(appUrl);
        
        if (supported) {
          await Linking.openURL(appUrl);
          console.log('   Uygulama başlatıldı');
        } else {

          const playStoreUrl = `market://details?id=${packageName}`;
          const playStoreSupported = await Linking.canOpenURL(playStoreUrl);
          
          if (playStoreSupported) {
            Alert.alert(
              'Uygulama Bulunamadı',
              `${appName} yüklü değil. Play Store'da açılsın mı?`,
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Aç', onPress: () => Linking.openURL(playStoreUrl) }
              ]
            );
          } else {
            Alert.alert('Hata', `${appName} bulunamadı`);
          }
        }
      }
    } catch (error) {
      console.error('Uygulama başlatma hatası:', error);
      Alert.alert('Hata', 'Uygulama başlatılamadı');
    }
  }
  

  // Platforma göre uygulama kimliği: Android'de paket adı, iOS'ta URL şeması
  getAppIdentifier(appName) {
    if (Platform.OS === 'ios') return this.getAppUrlScheme(appName);
    return this.getAppPackageName(appName);
  }

  // iOS URL şemaları — app.json > ios.infoPlist.LSApplicationQueriesSchemes ile eşleşmeli
  getAppUrlScheme(appName) {
    const schemes = {
      'whatsapp': 'whatsapp',
      'instagram': 'instagram',
      'facebook': 'fb',
      'twitter': 'twitter',
      'spotify': 'spotify',
      'youtube': 'youtube',
      'gmail': 'googlegmail',
      'chrome': 'googlechrome',
      'maps': 'comgooglemaps',
      'telegram': 'tg',
      'tiktok': 'snssdk1233',
      'netflix': 'nflx',
      'amazon': 'com.amazon.mobile.shopping'
    };
    return schemes[appName.toLowerCase()];
  }

  getAppPackageName(appName) {
    const packages = {
      'whatsapp': 'com.whatsapp',
      'instagram': 'com.instagram.android',
      'facebook': 'com.facebook.katana',
      'twitter': 'com.twitter.android',
      'spotify': 'com.spotify.music',
      'youtube': 'com.google.android.youtube',
      'gmail': 'com.google.android.gm',
      'chrome': 'com.android.chrome',
      'maps': 'com.google.android.apps.maps',
      'telegram': 'org.telegram.messenger',
      'tiktok': 'com.zhiliaoapp.musically',
      'netflix': 'com.netflix.mediaclient',
      'amazon': 'com.amazon.mShop.android.shopping'
    };
    
    return packages[appName.toLowerCase()];
  }
  

  getContactPhone(contactName) {
    const contacts = {
      'babam': '+905551234567',
      'annem': '+905551234568',
      'kardeşim': '+905551234569',
      'eşim': '+905551234570',
      'ablam': '+905551234571',
      'abim': '+905551234572'
    };
    
    return contacts[contactName.toLowerCase()];
  }
  

  async findRealContactPhone(contactName) {
    try {
      console.log(`   Gerçek kişilerde aranıyor: ${contactName}`);
      

      const realPhone = await contactsService.findPhoneByName(contactName);
      
      if (realPhone) {
        console.log(`   Gerçek kişide bulundu: ${realPhone}`);
        return realPhone;
      }
      

      console.log(`Demo kişilerde aranıyor: ${contactName}`);
      const demoPhone = this.getContactPhone(contactName);
      
      if (demoPhone) {
        console.log(`   Demo kişide bulundu: ${demoPhone}`);
        return demoPhone;
      }
      
      console.log(`   Hiçbir yerde bulunamadı: ${contactName}`);
      return null;
      
    } catch (error) {
      console.error('Kişi arama hatası:', error);
      return this.getContactPhone(contactName); 
    }
  }
}

export const nativeService = new NativeService();