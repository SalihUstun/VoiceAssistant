# VoiceAssistant (Jarvis) 🎙️

Türkçe konuşan, sesli komutla alarm kuran, kişi arayan, uygulama açan ve hava durumu söyleyen mobil sesli asistan. Üç katmandan oluşur:

| Katman | Teknoloji | Klasör |
|---|---|---|
| Mobil uygulama (iOS + Android) | React Native · Expo SDK 54 | `VoiceAssistant.Mobile/` |
| REST API · kimlik doğrulama · komut işleme | ASP.NET Core 9 · EF Core · PostgreSQL · JWT | `VoiceAssistant/` |
| Ses işleme · niyet (intent) analizi · LLM | Python · FastAPI · ElevenLabs (STT/TTS) · Ollama (llama3.2) | `VoiceAssistant.AI/` |

## Mimari

```
┌──────────────────┐   m4a (multipart)   ┌────────────────────┐   m4a    ┌──────────────────────┐
│  Mobil (Expo RN) │ ───────────────────▶│  .NET API  :5242   │ ───────▶ │  Python AI  :8000    │
│  iOS / Android   │ ◀─────────────────── │  JWT · PostgreSQL  │ ◀─────── │  STT → Intent → TTS  │
└──────────────────┘  metin+intent+mp3   └────────────────────┘          └──────────────────────┘
        │
        └─ Cihaz tarafı aksiyonlar: alarm (Saat uygulaması), arama (tel:), uygulama açma (URL şeması)
```

Akış: Mobil uygulama mikrofonu kaydeder → `POST /api/Assistant/send-audio` → .NET API dosyayı Python servisine iletir → ElevenLabs Scribe ile metne çevrilir → regex tabanlı intent sınıflandırma (`create_alarm`, `make_call`, `open_app`, `weather`, `general_question`) → komut ise hazır yanıt, değilse Ollama'ya sorulur → ElevenLabs TTS ile sese çevrilip base64 olarak döner → mobil uygulama sesi çalar ve `commandResult.action`'a göre cihazda işlem yapar.

## Gereksinimler

- **Node.js 18+**, **npm**, Expo CLI (`npx expo`)
- **.NET 9 SDK**, **PostgreSQL 14+**
- **Python 3.9+**, **ffmpeg** (pydub için — `brew install ffmpeg`)
- **Ollama** + `llama3.2` modeli (`ollama pull llama3.2`)
- **ElevenLabs API anahtarı**
- iOS için: macOS + **Xcode 15+** + CocoaPods (`brew install cocoapods`), veya EAS Build

## Kurulum

### 1) Veritabanı ve .NET API

```bash
cd VoiceAssistant
# appsettings.json içindeki ConnectionStrings:DefaultConnection değerini kendi PostgreSQL bilgilerinizle güncelleyin
dotnet ef database update --project VoiceAssistant.DataAccess --startup-project VoiceAssistant.API
dotnet run --project VoiceAssistant.API
```

API `http://0.0.0.0:5242` üzerinde çalışır (Swagger: `http://localhost:5242/swagger`). `0.0.0.0` sayesinde aynı Wi‑Fi'daki telefon LAN IP'si ile erişebilir.

### 2) Python AI servisi

```bash
cd VoiceAssistant.AI
python3 -m venv .venv && source .venv/bin/activate
pip install -r paketler.txt
cp .env.example .env            # ELEVENLABS_API_KEY değerini girin (main.py otomatik yükler)
ollama serve &                  # ayrı bir terminalde çalışıyor olmalı
python main.py                  # http://0.0.0.0:8000
```

> .NET API, Python servisine `http://localhost:8000` üzerinden bağlanır (`AIService.cs`). İkisinin aynı makinede çalışması beklenir.

### 3) Mobil uygulama

```bash
cd VoiceAssistant.Mobile
npm install
cp .env.example .env            # EXPO_PUBLIC_API_URL = http://<LAN-IP>:5242/api
```

Uygulama `expo-dev-client` kullanır; **Expo Go ile çalışmaz**, native build gerekir.

#### iOS (simülatör veya cihaz)

```bash
npx expo prebuild --platform ios     # ios/ klasörünü app.json'dan üretir
npx expo run:ios                     # simülatör
npx expo run:ios --device            # bağlı iPhone (Apple Developer hesabı/imzalama gerekir)
```

Bulut build için:

```bash
npx eas build --profile development --platform ios
```

#### Android

```bash
npx expo run:android
```

## iOS'a özgü notlar

Cihaz tarafındaki işlemler platforma göre farklı çalışır (`services/nativeService.js` ve `services/permissionService.js`):

| Konu | Android | iOS |
|---|---|---|
| Arama | `tel:` + `CALL_PHONE` izni | `telprompt:` (izin gerekmez, sistem onay diyaloğu gösterir) |
| Alarm | `SET_ALARM` intent'i ile doğrudan kurulur | iOS'ta üçüncü parti uygulama alarm kuramaz → Saat uygulaması `clock-alarm://` ile açılır ve saat kullanıcıya gösterilir |
| Uygulama açma | `android-app://<paket>` | URL şeması (`whatsapp://`, `instagram://`, …) — şemalar `app.json > ios.infoPlist.LSApplicationQueriesSchemes` listesinde tanımlı olmalı |
| Kişiler izni | `PermissionsAndroid.READ_CONTACTS` | `expo-contacts` + `NSContactsUsageDescription` |
| HTTP (yerel ağ) | serbest | ATS için `NSAllowsArbitraryLoads` / `NSAllowsLocalNetworking` + `NSLocalNetworkUsageDescription` |
| Bundle ID | `com.salihustun57.voiceassistantmobile` | aynı (Türkçe karakter içeren eski ID geçersizdi) |

## API uç noktaları

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| POST | `/api/Auth/register` | – | `firstName, lastName, username, email, password` |
| POST | `/api/Auth/login` | – | `username, password` → `{ token, userId, username }` |
| POST | `/api/Assistant/send-audio` | JWT | multipart: `UserId`, `AudioFile` → tanınan metin, yanıt, `audioBase64`, `intent`, `action`, `commandResult` |
| GET/POST/DELETE | `/api/Command/alarms[/{id}]` | JWT | Alarm listele / oluştur (`time, label`) / sil |
| GET | `/api/Command/contacts` | JWT | Kayıtlı kişiler |
| POST | `/api/Command/call` | JWT | `contactName` |
| GET/POST | `/api/Command/apps`, `/api/Command/launch-app` | JWT | Uygulama listesi / başlat (`appName`) |
| GET | `/api/Command/weather[/forecast]` | JWT | `location`, `date` |
| GET | `/api/History/{userId}` | – | Sohbet geçmişi |

Python servisi: `POST /api/process-audio` (`file`, `user_id`) → `{ transcribedText, llmResponse, audioBase64, intent, entities, action, parameters }`

## Desteklenen sesli komutlar (örnek)

- "Saat yediye alarm kur", "8:30'da uyandır"
- "Annemi ara", "Ahmet'i ara"
- "WhatsApp'ı aç", "Spotify başlat"
- "Bugün hava nasıl", "İstanbul'da hava durumu"
- Diğer her şey → llama3.2 ile serbest sohbet

## Ortam değişkenleri

| Değişken | Nerede | Açıklama |
|---|---|---|
| `ELEVENLABS_API_KEY` | Python servisi | ElevenLabs STT/TTS anahtarı (**zorunlu**) |
| `EXPO_PUBLIC_API_URL` | Mobil (`.env`) | .NET API adresi, örn. `http://192.168.1.10:5242/api` |
| `ConnectionStrings:DefaultConnection` | `appsettings.json` | PostgreSQL bağlantısı |
| `JwtSettings:SecretKey` | `appsettings.json` | JWT imzalama anahtarı — üretimde değiştirin |

## Proje yapısı

```
VoiceAssistant/
├── VoiceAssistant.Mobile/        # Expo / React Native
│   ├── App.js                    # Navigasyon + oturum kontrolü
│   ├── screens/                  # Login, Register, Home (sohbet + mikrofon)
│   └── services/
│       ├── apiService.js         # axios + JWT interceptor
│       ├── authService.js        # SecureStore ile token yönetimi
│       ├── commandService.js     # API'den gelen commandResult'ı cihaz aksiyonuna çevirir
│       ├── nativeService.js      # Platforma özel: alarm, arama, uygulama açma
│       ├── permissionService.js  # Android/iOS izinleri
│       └── contactsService.js    # Rehberde isimle numara bulma
├── VoiceAssistant/               # .NET çözümü
│   ├── VoiceAssistant.API/       # Controller'lar, Program.cs, JWT, Swagger
│   ├── VoiceAssistant.Business/  # Servisler, DTO'lar, JWT/Hash yardımcıları
│   └── VoiceAssistant.DataAccess/# EF Core context, entity'ler, migration'lar
└── VoiceAssistant.AI/
    ├── main.py                   # FastAPI: STT → intent → LLM → TTS
    └── paketler.txt              # pip bağımlılıkları
```
