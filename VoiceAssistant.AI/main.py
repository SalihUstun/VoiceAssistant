from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import uvicorn
import shutil
import os
import ollama  
from elevenlabs.client import ElevenLabs
import base64
from pydub import AudioSegment, silence
import re
import json
from typing import Dict, Any, Optional

ELEVENLABS_API_KEY = "sk_8a9394ab1885d419b8dceeb7d34f0042386d2226e99a9aaf"

# Intent Classification Patterns
INTENT_PATTERNS = {
    "create_alarm": {
        "patterns": [
            r"alarm (kur|oluştur|ayarla)",
            r"(saat|alarm) (\d{1,2}):?(\d{2})? (da|de|için)",
            r"(\d{1,2}):?(\d{2})? (da|de) (uyandır|alarm)",
            r"yarın saat (\d{1,2}):?(\d{2})? (da|de) (uyandır|alarm)",
            r"(\d{1,2}) (da|de) uyandır",
            r"saat (yediye|sekize|dokuza|ona) alarm",
            r"(yediye|sekize|dokuza|ona) alarm kur",
            r"(bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|onbir|oniki) (da|de) alarm",
            r"(bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|onbir|oniki)'?e alarm"
        ],
        "action": "CREATE_ALARM",
        "entities": ["time", "date", "label"]
    },
    "make_call": {
        "patterns": [
            r"(ara|telefon et) (.+)",
            r"(.+) (ı|i|u|ü|a|e) ara",
            r"(.+) (telefon et|ara)",
            r"(babam|annem|kardeşim|eşim) (ı|i) ara"
        ],
        "action": "MAKE_CALL",
        "entities": ["contact_name"]
    },
    "open_app": {
        "patterns": [
            r"(.+) (uygulamasını|uygulamayı) aç",
            r"(.+) aç",
            r"(.+) başlat",
            r"(.+) çalıştır"
        ],
        "action": "OPEN_APP",
        "entities": ["app_name"]
    },
    "weather": {
        "patterns": [
            r"hava durumu",
            r"bugün hava nasıl",
            r"yarın hava durumu",
            r"(.+) (da|de) hava durumu",
            r"(.+) hava durumu"
        ],
        "action": "GET_WEATHER",
        "entities": ["location", "date"]
    },
    "general_question": {
        "patterns": [
            r".*"  # Fallback pattern
        ],
        "action": "GENERAL_CHAT",
        "entities": []
    }
}


app = FastAPI()


try:
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
except Exception as e:
    print(f"ElevenLabs Bağlantı Hatası: {e}")


UPLOAD_DIR = "temp_uploads"
OUTPUT_DIR = "temp_outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

class AIResponse(BaseModel):
    transcribedText: str
    llmResponse: str
    audioBase64: str
    intent: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None
    action: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class IntentResult(BaseModel):
    intent: str
    confidence: float
    entities: Dict[str, Any]
    action: str
    parameters: Dict[str, Any]

@app.get("/")
def read_root():
    return {"message": "VoiceAssistant AI Service (ElevenLabs + Ollama + Silence Check) Running! 🚀"}

def convert_to_mp3(input_path):

    try:
        audio = AudioSegment.from_file(input_path)
        mp3_path = input_path + ".mp3"
        audio.export(mp3_path, format="mp3")
        return mp3_path
    except Exception as e:
        print(f"Ses dönüştürme hatası: {e}")
        raise e

def is_silent(audio_path, silence_threshold=-40.0):

    try:
        audio = AudioSegment.from_file(audio_path)
        if len(audio) < 500: return True
        if audio.dBFS < silence_threshold: return True
        return False
    except Exception as e:
        print(f"Sessizlik kontrolü hatası: {e}")
        return True 

def speech_to_text_elevenlabs(audio_path):

    try:
        if is_silent(audio_path):
            print("🤫 Ses dosyası sessiz algılandı.")
            return "Ses anlaşılamadı."

        with open(audio_path, "rb") as audio_file:
            transcript = client.speech_to_text.convert(
                file=audio_file,
                model_id="scribe_v1",
                language_code="tur", 
                tag_audio_events=False
            )
        
        text = transcript.text.strip()
        if len(text) < 2: return "Ses anlaşılamadı."
        return text
    except Exception as e:
        print(f"ElevenLabs STT Hatası: {e}")
        return "Ses anlaşılamadı."

def classify_intent(text: str) -> IntentResult:
    """
    Kullanıcı metnini analiz ederek intent ve entity'leri çıkarır
    """
    text_lower = text.lower().strip()
    
    for intent_name, intent_config in INTENT_PATTERNS.items():
        for pattern in intent_config["patterns"]:
            match = re.search(pattern, text_lower)
            if match:
                entities = extract_entities(text_lower, match, intent_config["entities"])
                
                return IntentResult(
                    intent=intent_name,
                    confidence=0.9 if intent_name != "general_question" else 0.3,
                    entities=entities,
                    action=intent_config["action"],
                    parameters=entities
                )
    
    # Fallback to general question
    return IntentResult(
        intent="general_question",
        confidence=0.3,
        entities={},
        action="GENERAL_CHAT",
        parameters={}
    )

def extract_entities(text: str, match, entity_types: list) -> Dict[str, Any]:
    """
    Regex match'inden entity'leri çıkarır
    """
    entities = {}
    
    if "time" in entity_types:
        # Saat çıkarma için daha kapsamlı regex
        time_patterns = [
            r"saat (\d{1,2}):?(\d{2})?",
            r"(\d{1,2}):(\d{2})",
            r"(\d{1,2}) (da|de)",
            r"(\d{1,2})\.(\d{2})",
            r"(\d{1,2})'?e",
            r"(\d{1,2})'?a",
            r"yediye",  # "yedi" için özel case
            r"sekize",  # "sekiz" için özel case
            r"dokuza",  # "dokuz" için özel case
            r"ona"      # "on" için özel case
        ]
        
        # Sayı kelimelerini rakama çevirme
        number_words = {
            "bir": "1", "iki": "2", "üç": "3", "dört": "4", "beş": "5",
            "altı": "6", "yedi": "7", "sekiz": "8", "dokuz": "9", "on": "10",
            "onbir": "11", "oniki": "12", "yediye": "7", "sekize": "8", 
            "dokuza": "9", "ona": "10"
        }
        
        for pattern in time_patterns:
            time_match = re.search(pattern, text)
            if time_match:
                if pattern in [r"yediye", r"sekize", r"dokuza", r"ona"]:
                    # Özel kelime durumları
                    hour = int(number_words.get(time_match.group(0), "8"))
                    minute = 0
                else:
                    hour = int(time_match.group(1))
                    minute = int(time_match.group(2)) if time_match.group(2) else 0
                entities["time"] = f"{hour:02d}:{minute:02d}"
                break
        
        # Kelime olarak yazılmış saatleri kontrol et
        if "time" not in entities:
            for word, number in number_words.items():
                if word in text:
                    entities["time"] = f"{int(number):02d}:00"
                    break
        
        # "yediye", "sekize" gibi özel durumlar için
        if "time" not in entities:
            special_time_words = {
                "yediye": "07:00", "sekize": "08:00", "dokuza": "09:00", 
                "ona": "10:00", "bire": "01:00", "ikiye": "02:00",
                "üçe": "03:00", "dörde": "04:00", "beşe": "05:00", "altıya": "06:00"
            }
            for word, time in special_time_words.items():
                if word in text:
                    entities["time"] = time
                    break
        
        # Eğer hiç saat bulunamazsa default
        if "time" not in entities:
            entities["time"] = "08:00"
    
    if "contact_name" in entity_types:
        # İsim çıkarma logic'i
        contact_patterns = [
            r"(babam|annem|kardeşim|eşim|ablam|abim)",
            r"ara (.+)",
            r"(.+) (ı|i|u|ü|a|e) ara"
        ]
        for pattern in contact_patterns:
            contact_match = re.search(pattern, text)
            if contact_match:
                if contact_match.group(1) in ["babam", "annem", "kardeşim", "eşim", "ablam", "abim"]:
                    entities["contact_name"] = contact_match.group(1)
                else:
                    entities["contact_name"] = contact_match.group(1).strip()
                break
    
    if "app_name" in entity_types:
        app_match = re.search(r"(.+?) (uygulamasını|uygulamayı|aç|başlat|çalıştır)", text)
        if app_match:
            entities["app_name"] = app_match.group(1).strip()
    
    if "location" in entity_types:
        location_match = re.search(r"(.+?) (da|de) hava", text)
        if location_match:
            entities["location"] = location_match.group(1).strip()
        elif re.search(r"(.+?) hava durumu", text):
            location_match = re.search(r"(.+?) hava durumu", text)
            if location_match:
                entities["location"] = location_match.group(1).strip()
        else:
            entities["location"] = "current"  # Default to current location
    
    if "date" in entity_types:
        if "yarın" in text:
            entities["date"] = "tomorrow"
        elif "bugün" in text:
            entities["date"] = "today"
        else:
            entities["date"] = "today"  # Default
    
    if "label" in entity_types:
        # Alarm label çıkarma
        label_match = re.search(r"(için|etiket) (.+)", text)
        if label_match:
            entities["label"] = label_match.group(2).strip()
        else:
            entities["label"] = "Alarm"  # Default
    
    return entities

def generate_smart_response(intent_result: IntentResult, original_text: str) -> str:
    """
    Intent'e göre akıllı yanıt üretir
    """
    if intent_result.action == "CREATE_ALARM":
        time = intent_result.entities.get("time", "belirsiz saat")
        label = intent_result.entities.get("label", "Alarm")
        return f"Tamam, {time} için '{label}' alarmını kuruyorum."
    
    elif intent_result.action == "MAKE_CALL":
        contact = intent_result.entities.get("contact_name", "kişi")
        return f"Tamam, {contact} arıyorum."
    
    elif intent_result.action == "OPEN_APP":
        app_name = intent_result.entities.get("app_name", "uygulama")
        return f"Tamam, {app_name} uygulamasını açıyorum."
    
    elif intent_result.action == "GET_WEATHER":
        location = intent_result.entities.get("location", "bulunduğunuz konum")
        date = intent_result.entities.get("date", "bugün")
        if location == "current":
            return f"Tamam, {date} için hava durumunu kontrol ediyorum."
        else:
            return f"Tamam, {location} için {date} hava durumunu kontrol ediyorum."
    
    else:
        # General chat için Ollama kullan
        return ask_llama_local(original_text)

def ask_llama_local(prompt):

    try:
        response = ollama.chat(model='llama3.2', messages=[
            {
                'role': 'system',
                'content': 'Sen Türkçe konuşan samimi bir asistansın. Cevapların kısa olsun.'
            },
            {
                'role': 'user',
                'content': prompt
            },
        ])
        return response['message']['content']
    except Exception as e:
        print(f"Ollama Bağlantı Hatası: {e}")
        return "Beynime ulaşamıyorum."

def text_to_speech_elevenlabs(text, output_filename):

    try:
        audio_generator = client.text_to_speech.convert(
            text=text,
            voice_id="JBFqnCBsd6RMkjVDRZzb", 
            model_id="eleven_multilingual_v2"
        )

        save_path = f"{OUTPUT_DIR}/{output_filename}"
        with open(save_path, "wb") as f:
            for chunk in audio_generator:
                f.write(chunk)
        return save_path
    except Exception as e:
        print(f"ElevenLabs TTS Hatası: {e}")
        return None

def get_audio_base64(file_path):
    with open(file_path, "rb") as audio_file:
        encoded_string = base64.b64encode(audio_file.read()).decode('utf-8')
    return encoded_string

@app.post("/api/process-audio", response_model=AIResponse)
async def process_audio(
    file: UploadFile = File(...), 
    user_id: str = Form(...)
):
    try:
        print(f" İşlem Başladı - Dosya: {file.filename}")
        input_path = f"{UPLOAD_DIR}/{file.filename}"
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print("Formatlanıyor...")
        mp3_path = convert_to_mp3(input_path)

        print(" Dinleniyor...")
        user_text = speech_to_text_elevenlabs(mp3_path)
        print(f" Metin: {user_text}")

        if user_text in ["Ses anlaşılamadı.", ""]:
            ai_reply = "Dediklerini anlayamadım."
            audio_b64 = ""
            intent_result = None
        else:
            print("🧠 Intent analiz ediliyor...")
            intent_result = classify_intent(user_text)
            print(f"🎯 Intent: {intent_result.intent}, Action: {intent_result.action}")
            print(f"📊 Entities: {intent_result.entities}")
            
            print("💭 Yanıt üretiliyor...")
            ai_reply = generate_smart_response(intent_result, user_text)
            print(f"💬 Cevap: {ai_reply}")

            print("🔊 Konuşuluyor...")
            output_file = f"response_{user_id}.mp3"
            audio_path = text_to_speech_elevenlabs(ai_reply, output_file)
            
            audio_b64 = ""
            if audio_path:
                audio_b64 = get_audio_base64(audio_path)

        return AIResponse(
            transcribedText=user_text,
            llmResponse=ai_reply,
            audioBase64=audio_b64,
            intent=intent_result.intent if intent_result else None,
            entities=intent_result.entities if intent_result else None,
            action=intent_result.action if intent_result else None,
            parameters=intent_result.parameters if intent_result else None
        )

    except Exception as e:
        print(f"❌ HATA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)