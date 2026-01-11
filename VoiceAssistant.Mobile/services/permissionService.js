import { Alert, Linking, Platform, PermissionsAndroid } from 'react-native';

class PermissionService {
  
  // Telefon arama izni kontrol et ve iste (Android için)
  async requestCallPermission() {
    try {
      console.log('📞 Telefon arama izni kontrol ediliyor...');
      
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Telefon Arama İzni',
            message: 'Bu uygulama telefon araması yapabilmek için izin istiyor.',
            buttonNeutral: 'Daha Sonra Sor',
            buttonNegative: 'İptal',
            buttonPositive: 'İzin Ver',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Telefon arama izni verildi');
          return true;
        } else {
          console.log('❌ Telefon arama izni reddedildi');
          this.showPermissionDeniedAlert('Telefon Arama', 'Arama yapabilmek için telefon iznine ihtiyaç var.');
          return false;
        }
      }
      
      return true; // iOS için farklı yaklaşım gerekebilir
    } catch (error) {
      console.error('Telefon izni hatası:', error);
      return false;
    }
  }
  
  // Kişiler izni kontrol et ve iste
  async requestContactsPermission() {
    try {
      console.log('📋 Kişiler izni kontrol ediliyor...');
      
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Kişiler İzni',
            message: 'Bu uygulama kişilerinize erişmek için izin istiyor.',
            buttonNeutral: 'Daha Sonra Sor',
            buttonNegative: 'İptal',
            buttonPositive: 'İzin Ver',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Kişiler izni verildi');
          return true;
        } else {
          console.log('❌ Kişiler izni reddedildi');
          this.showPermissionDeniedAlert('Kişiler', 'Kişileri arayabilmek için kişiler iznine ihtiyaç var.');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Kişiler izni hatası:', error);
      return false;
    }
  }
  
  // İzin reddedildi uyarısı
  showPermissionDeniedAlert(permissionName, message) {
    Alert.alert(
      `${permissionName} İzni Gerekli`,
      `${message} Ayarlardan izin verebilirsiniz.`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Ayarlara Git', 
          onPress: () => Linking.openSettings()
        }
      ]
    );
  }
  
  // Tüm gerekli izinleri kontrol et
  async checkAllPermissions() {
    console.log('🔍 Tüm izinler kontrol ediliyor...');
    
    const callPermission = await this.requestCallPermission();
    const contactsPermission = await this.requestContactsPermission();
    
    const allGranted = callPermission && contactsPermission;
    
    if (allGranted) {
      console.log('✅ Tüm izinler verildi');
    } else {
      console.log('❌ Bazı izinler eksik');
    }
    
    return allGranted;
  }
}

export const permissionService = new PermissionService();