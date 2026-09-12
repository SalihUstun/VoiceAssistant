import { Alert, Linking, Platform, PermissionsAndroid } from 'react-native';
import * as Contacts from 'expo-contacts';

class PermissionService {
  

  async requestCallPermission() {
    try {
      
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

          return true;
        } else {

          this.showPermissionDeniedAlert('Telefon Arama', 'Arama yapabilmek için telefon iznine ihtiyaç var.');
          return false;
        }
      }
      
      // iOS'ta tel: / telprompt: için çalışma zamanı izni gerekmez
      return true; 
    } catch (error) {
      console.error('Telefon izni hatası:', error);
      return false;
    }
  }
  

  async requestContactsPermission() {
    try {
      
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
          return true;
        } else {
          this.showPermissionDeniedAlert('Kişiler', 'Kişileri arayabilmek için kişiler iznine ihtiyaç var.');
          return false;
        }
      }
      
      // iOS: izin NSContactsUsageDescription (app.json) ile expo-contacts üzerinden istenir
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        return true;
      }
      this.showPermissionDeniedAlert('Kişiler', 'Kişileri arayabilmek için kişiler iznine ihtiyaç var.');
      return false;
    } catch (error) {
      console.error('Kişiler izni hatası:', error);
      return false;
    }
  }
  

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
  

  async checkAllPermissions() {
    
    const callPermission = await this.requestCallPermission();
    const contactsPermission = await this.requestContactsPermission();
    
    const allGranted = callPermission && contactsPermission;
    
    return allGranted;
  }
}

export const permissionService = new PermissionService();