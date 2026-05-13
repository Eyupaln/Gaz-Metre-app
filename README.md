Gaz Metre App
Bu proje; MQ-2 ve MQ-135 sensörleri kullanılarak geliştirilmiş, Python tabanlı bir gaz ölçüm ve takip sistemidir. Donanımdan alınan veriler Firebase veritabanına aktarılırken, kullanıcıya Telegram botu ve özel bir uygulama üzerinden anlık bilgi sunulmaktadır.

🛠 Özellikler
Sensör Okuma: MQ-2 ve MQ-135 sensörlerinden hassas veri alımı.

Firebase Entegrasyonu: Verilerin Python aracılığıyla Firebase Realtime Database'e anlık aktarımı.

Telegram Botu: Kritik eşikler ve durum güncellemeleri için anlık bildirim sistemi.

Uygulama Desteği: Verilerin izlenebileceği harici uygulama entegrasyonu.

💻 Kullanılan Teknolojiler
Dil: Python

Veritabanı: Firebase

Haberleşme: Telegram Bot API & Serial Port

Donanım: Arduino / MQ Sensör Serisi

🚀 Kurulum
Gerekli kütüphaneleri yükleyin:

Bash
pip install firebase-admin python-telegram-bot pyserial
Python dosyasındaki Firebase ve Telegram API bilgilerini kendi anahtarlarınızla güncelleyin.

Uygulamayı çalıştırın.

🌐 English Description
This project is a gas monitoring system using MQ-2 and MQ-135 sensors. Data is collected via Python, synced with Firebase, and can be monitored through a dedicated app and a Telegram bot.

Real-time Data: Instant sensor readings synced to Firebase.

Telegram Alerts: Automated notifications via Telegram bot.

Dedicated App: Custom interface for tracking gas levels.
