import serial
import requests
import time
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime

# === AYARLAR ===
PORT     = "COM6"
BAUDRATE = 9600
TOKEN    = "8794271988:AAEITOFrvQMVQasOPHyVmHE7o6rDPABAAEI"
CHAT_ID  = "7599928878"
FIREBASE_URL = "https://gaztakip-2e3a1-default-rtdb.europe-west1.firebasedatabase.app/"
# ===============

# --- FIREBASE BAĞLANTISI ---
# İndirdiğin json dosyasının adının 'firebase-key.json' olduğundan emin ol
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': FIREBASE_URL
})
ref = db.reference('canli_gaz')

COOLDOWN = 60
last_sent = {}

def firebase_gonder(mq2, mq135, durum_metni):
    """Veriyi Realtime Database'e anlık basar."""
    try:
        ref.set({
            'mq2': mq2,
            'mq135': mq135,
            'durum': durum_metni,
            'saat': datetime.now().strftime("%H:%M:%S")
        })
    except Exception as e:
        print(f"[Firebase Hata] {e}")

def telegram_gonder(mesaj):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    try:
        requests.post(url, data={"chat_id": CHAT_ID, "text": mesaj})
        print(f"[Telegram] Gönderildi: {mesaj}")
    except Exception as e:
        print(f"[Hata] {e}")

def bildirim(durum, mesaj):
    simdi = time.time()
    if durum not in last_sent or simdi - last_sent[durum] > COOLDOWN:
        last_sent[durum] = simdi
        telegram_gonder(mesaj)

def mq_degerlerini_ayikla(satir):
    try:
        mq2   = int(satir.split("MQ-2:")[1].split("|")[0].strip())
        mq135 = int(satir.split("MQ-135:")[1].split("|")[0].strip())
        return mq2, mq135
    except:
        return None, None

print(f"[Baglanıyor] {PORT}...")
try:
    ser = serial.Serial(PORT, BAUDRATE, timeout=2)
    time.sleep(2)
    print("[Hazır] Arduino dinleniyor ve Firebase'e veri akıyor...\n")
except Exception as e:
    print(f"[Hata] Port açılırken sorun oluştu: {e}")
    exit()

while True:
    try:
        satir = ser.readline().decode("utf-8", errors="ignore").strip()
        if not satir:
            continue

        print(f"[Serial] {satir}")

        mq2, mq135 = mq_degerlerini_ayikla(satir)
        
        # Durum belirleme
        anlik_durum = "Normal"
        if "KRITIK SEVIYE" in satir: anlik_durum = "Kritik"
        elif "Gaz Yukseliyor" in satir: anlik_durum = "Uyarı"

        # Her döngüde Firebase'i güncelle (App'te canlı görmek için)
        if mq2 is not None:
            firebase_gonder(mq2, mq135, anlik_durum)

        # Telegram Bildirim Mantığı
        deger_str = f"MQ-2: {mq2}  |  MQ-135: {mq135}" if mq2 else ""

        if anlik_durum == "Kritik":
            bildirim("kritik", f"🚨 KRİTİK TEHLİKE!\n{deger_str}")
        elif anlik_durum == "Uyarı":
            bildirim("uyari", f"⚠️ UYARI: Gaz yükseliyor!\n{deger_str}")
        elif "Ortam Temiz" in satir:
            if "kritik" in last_sent or "uyari" in last_sent:
                bildirim("temiz", f"✅ Ortam normale döndü.\n{deger_str}")
                last_sent.clear() # Durum düzelince cooldown'ları sıfırla

    except serial.SerialException as e:
        print(f"[Serial Hata] {e}")
        time.sleep(3)
    except KeyboardInterrupt:
        print("\nDurduruldu.")
        break

ser.close()