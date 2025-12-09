from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import uvicorn
import shutil
import os
import ollama  
from elevenlabs.client import ElevenLabs
import base64
from pydub import AudioSegment, silence

ELEVENLABS_API_KEY = "sk_8a9394ab1885d419b8dceeb7d34f0042386d2226e99a9aaf"


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
        else:
            print("Düşünülüyor...")
            ai_reply = ask_llama_local(user_text)
            print(f"Cevap: {ai_reply}")

            print("Konuşuluyor...")
            output_file = f"response_{user_id}.mp3"
            audio_path = text_to_speech_elevenlabs(ai_reply, output_file)
            
            audio_b64 = ""
            if audio_path:
                audio_b64 = get_audio_base64(audio_path)

        return AIResponse(
            transcribedText=user_text,
            llmResponse=ai_reply,
            audioBase64=audio_b64
        )

    except Exception as e:
        print(f"❌ HATA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)