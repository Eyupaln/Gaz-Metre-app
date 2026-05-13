![Uygulama Ekranı](assets/icon.png)
# 🔥 Gaz Metre

MQ-2 ve MQ-135 sensörleriyle gerçek zamanlı gaz izleme sistemi. Veriler Firebase'e aktarılır, Telegram botu üzerinden anlık uyarı gönderilir.

---

## Nasıl Çalışır

```
Arduino (MQ-2 / MQ-135)
        │
        ▼ Serial Port
   Python Script
        │
   ┌────┴────┐
   ▼         ▼
Firebase   Telegram Bot
   │
   ▼
Mobil Uygulama (React Native)
```

Sensörlerden okunan değerler seri port üzerinden Python'a gelir. Python bu verileri Firebase Realtime Database'e yazar ve kritik eşikler aşıldığında Telegram botu aracılığıyla bildirim gönderir. Firebase'e yazılan veriler, React Native ile geliştirilen mobil uygulama üzerinden anlık olarak izlenebilir.

---

## Özellikler

- **Sensör okuma** — MQ-2 (yanıcı gazlar / duman) ve MQ-135 (hava kalitesi)
- **Firebase entegrasyonu** — Verilerin anlık olarak Realtime Database'e yazılması
- **Telegram bildirimleri** — Kritik eşik aşımlarında otomatik uyarı
- **Mobil uygulama** — Firebase'e bağlı React Native arayüzü ile anlık ve geçmiş veri görüntüleme

---

## Mobil Uygulama

Sensör verileri Firebase üzerinden React Native (Expo) ile geliştirilen mobil uygulamaya akar. Uygulama Firebase Realtime Database'e doğrudan bağlanarak verileri ekrana yansıtır.

📱 Uygulama reposu: [Eyupaln/Gaz-Metre-app](https://github.com/Eyupaln/Gaz-Metre-app)

**Uygulama kurulumu:**

```bash
npm install
npx expo start
```

`firebaseConfig.js` dosyasını kendi Firebase proje bilgilerinizle güncelleyin:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
};
```

---

## Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Donanım | Arduino, MQ-2, MQ-135 |
| Backend | Python 3 |
| Veritabanı | Firebase Realtime Database |
| Bildirim | Telegram Bot API |
| İletişim | Serial Port (`pyserial`) |
| Mobil Uygulama | React Native (Expo) |

---

## Kurulum

**1. Bağımlılıkları yükleyin:**

```bash
pip install firebase-admin python-telegram-bot pyserial
```

**2. Yapılandırmayı güncelleyin:**

`config.py` (veya ilgili dosya) içindeki şu değerleri kendi anahtarlarınızla değiştirin:

```python
FIREBASE_CREDENTIALS = "serviceAccountKey.json"
TELEGRAM_BOT_TOKEN   = "your-bot-token"
TELEGRAM_CHAT_ID     = "your-chat-id"
SERIAL_PORT          = "COM3"  # ya da "/dev/ttyUSB0"
```

**3. Çalıştırın:**

```bash
python main.py
```

---

## Donanım Bağlantısı

| Sensör | Ölçülen Değer |
|--------|---------------|
| MQ-2   | Yanıcı gazlar (LPG, metan, hidrojen), duman |
| MQ-135 | Hava kalitesi (CO₂, amonyak, benzen) |

---


