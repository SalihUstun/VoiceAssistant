import * as Contacts from 'expo-contacts';
import { Alert } from 'react-native';

class ContactsService {
  
  constructor() {
    this.contacts = [];
    this.contactsLoaded = false;
  }
  
  // Kişiler iznini kontrol et ve kişileri yükle
  async loadContacts() {
    try {
      console.log('📋 Kişiler yükleniyor...');
      
      // İzin kontrol et
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Kişiler izni reddedildi');
        Alert.alert('İzin Gerekli', 'Kişilere erişim için izin gerekli');
        return false;
      }
      
      // Kişileri getir
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
        ],
      });
      
      this.contacts = data;
      this.contactsLoaded = true;
      
      console.log(`✅ ${data.length} kişi yüklendi`);
      return true;
      
    } catch (error) {
      console.error('Kişiler yükleme hatası:', error);
      return false;
    }
  }
  
  // İsme göre kişi ara
  findContactByName(searchName) {
    if (!this.contactsLoaded) {
      console.log('❌ Kişiler henüz yüklenmedi');
      return null;
    }
    
    const searchLower = searchName.toLowerCase().trim();
    console.log(`🔍 Kişi aranıyor: "${searchName}"`);
    
    // Önce tam isim eşleşmesi ara
    let contact = this.contacts.find(contact => {
      const fullName = contact.name?.toLowerCase();
      const firstName = contact.firstName?.toLowerCase();
      const lastName = contact.lastName?.toLowerCase();
      
      return fullName === searchLower || 
             firstName === searchLower || 
             lastName === searchLower;
    });
    
    // Bulunamazsa kısmi eşleşme ara
    if (!contact) {
      contact = this.contacts.find(contact => {
        const fullName = contact.name?.toLowerCase() || '';
        const firstName = contact.firstName?.toLowerCase() || '';
        const lastName = contact.lastName?.toLowerCase() || '';
        
        return fullName.includes(searchLower) || 
               firstName.includes(searchLower) || 
               lastName.includes(searchLower);
      });
    }
    
    // Özel aile isimleri için arama
    if (!contact) {
      const familyNames = {
        'babam': ['baba', 'papa', 'dad', 'father'],
        'annem': ['anne', 'mama', 'mom', 'mother'],
        'kardeşim': ['kardeş', 'brother', 'sister'],
        'eşim': ['eş', 'wife', 'husband', 'spouse']
      };
      
      const searchTerms = familyNames[searchLower] || [];
      
      for (const term of searchTerms) {
        contact = this.contacts.find(contact => {
          const fullName = contact.name?.toLowerCase() || '';
          return fullName.includes(term);
        });
        if (contact) break;
      }
    }
    
    if (contact) {
      console.log(`✅ Kişi bulundu: ${contact.name}`);
      return contact;
    } else {
      console.log(`❌ Kişi bulunamadı: ${searchName}`);
      return null;
    }
  }
  
  // Kişinin telefon numarasını al
  getContactPhoneNumber(contact) {
    if (!contact || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return null;
    }
    
    // İlk telefon numarasını al
    const phoneNumber = contact.phoneNumbers[0].number;
    
    // Telefon numarasını temizle (boşluk, tire vb. kaldır)
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    console.log(`📞 Telefon numarası: ${cleanNumber}`);
    return cleanNumber;
  }
  
  // İsme göre telefon numarası bul
  async findPhoneByName(contactName) {
    try {
      // Kişiler yüklenmemişse yükle
      if (!this.contactsLoaded) {
        const loaded = await this.loadContacts();
        if (!loaded) return null;
      }
      
      // Kişiyi bul
      const contact = this.findContactByName(contactName);
      if (!contact) return null;
      
      // Telefon numarasını al
      return this.getContactPhoneNumber(contact);
      
    } catch (error) {
      console.error('Telefon numarası bulma hatası:', error);
      return null;
    }
  }
  
  // Tüm kişileri listele (debug amaçlı)
  listAllContacts() {
    if (!this.contactsLoaded) {
      console.log('❌ Kişiler henüz yüklenmedi');
      return;
    }
    
    console.log('📋 Tüm kişiler:');
    this.contacts.slice(0, 10).forEach((contact, index) => {
      const phone = contact.phoneNumbers?.[0]?.number || 'Telefon yok';
      console.log(`${index + 1}. ${contact.name} - ${phone}`);
    });
    
    if (this.contacts.length > 10) {
      console.log(`... ve ${this.contacts.length - 10} kişi daha`);
    }
  }
}

export const contactsService = new ContactsService();