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
```

Sensörlerden okunan değerler seri port üzerinden Python'a gelir. Python bu verileri hem Firebase Realtime Database'e yazar hem de eşik değerleri aşıldığında Telegram botu aracılığıyla bildirim gönderir. Veriler aynı zamanda harici bir uygulama üzerinden izlenebilir.

---

## Özellikler

- **Sensör okuma** — MQ-2 (yanıcı gazlar / duman) ve MQ-135 (hava kalitesi)
- **Firebase entegrasyonu** — Verilerin anlık olarak Realtime Database'e yazılması
- **Telegram bildirimleri** — Kritik eşik aşımlarında otomatik uyarı
- **Uygulama desteği** — Harici arayüz üzerinden geçmiş ve anlık veri takibi

---

## Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Donanım | Arduino, MQ-2, MQ-135 |
| Backend | Python 3 |
| Veritabanı | Firebase Realtime Database |
| Bildirim | Telegram Bot API |
| İletişim | Serial Port (`pyserial`) |

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

## Lisans

MIT
