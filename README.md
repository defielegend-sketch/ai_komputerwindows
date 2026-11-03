# AI Komputer

Asisten AI lokal untuk Windows yang bisa **menerima perintah bahasa Indonesia dan menjalankannya langsung** di komputer ini. Dibuat dengan Node.js + OpenRouter (GPT-4o mini) dan antarmuka web.

![status](https://img.shields.io/badge/status-siap%20pakai-34d399)

---

## Cara menjalankan

1. Klik dua kali **shortcut `AI Komputer` di Desktop**, atau **`start.bat`** di folder ini.
2. Browser akan terbuka otomatis di `http://127.0.0.1:8787`.
3. Ketik perintah, misalnya:
   - `Buka Notepad`
   - `Ambil screenshot layar`
   - `Buat folder Proyek di Desktop lalu buat file rencana.txt berisi 3 tugas saya`
   - `Berapa sisa ruang disk C?`
   - `Cari file laporan di folder Documents`
   - `Buka YouTube di browser`

Untuk menghentikan aplikasi: tutup jendela Command Prompt atau tekan `Ctrl+C`.

> Butuh **Node.js 18+** (sudah terpasang di komputer ini: v24).

---

## Fitur

| Kemampuan | Contoh perintah |
|---|---|
| Menjalankan cmd / PowerShell | "Tampilkan 10 proses dengan RAM terbesar" |
| Membuka aplikasi | "Buka kalkulator", "Buka Task Manager" |
| Membuka website | "Buka YouTube" |
| Membaca & menulis file | "Buat file catatan.txt di Desktop berisi agenda besok" |
| Melihat folder & mencari file | "Cari file pdf di Downloads" |
| Info sistem | "Cek RAM, CPU, dan sisa disk" |
| Screenshot | "Ambil screenshot layar" |
| Kontrol daya | "Matikan komputer" (perlu Mode Berbahaya) |
| Terminal manual | Tab **Terminal** — jalankan perintah Windows langsung |

Setiap aksi AI ditampilkan sebagai kartu langkah yang bisa dibuka untuk melihat perintah dan output aslinya.

---

## Keamanan

Aplikasi ini **benar-benar bisa menjalankan perintah** di komputer. Pengaman yang tersedia:

- **Mode Aman (default)** — memblokir shutdown/restart, penghapusan massal, registry, service, taskkill, dan sejenisnya.
- **Toggle "Izinkan aksi berbahaya"** — membuka aksi berisiko setelah konfirmasi.
- **Blokir permanen** — `format`, `diskpart`, `cipher /w`, `bcdedit`, dan `vssadmin delete` tidak akan pernah dijalankan.
- Server hanya mendengarkan di `127.0.0.1`, jadi tidak bisa diakses dari komputer lain di jaringan.
- Menulis file di luar folder pengguna juga diblokir saat Mode Aman aktif.

Tetap berhati-hati: AI bisa salah memahami perintah. Periksa kartu langkah sebelum mempercayai hasilnya.

---

## Konfigurasi

Semua pengaturan ada di **`.env`**:

```env
OPENROUTER_API_KEY=sk-or-v1-...
MODEL=openai/gpt-4o-mini
HOST=127.0.0.1
PORT=8787
COMMAND_TIMEOUT=60000
MAX_TOOL_ROUNDS=8
```

Model yang tersedia di aplikasi:

- `openai/gpt-4o-mini` — default, paling murah
- `google/gemini-2.5-flash`
- `openai/gpt-4.1-mini`
- `deepseek/deepseek-chat`
- `meta-llama/llama-3.3-70b-instruct`

Biaya per permintaan ditampilkan di kanan atas. Dengan GPT-4o mini, satu perintah biasanya jauh di bawah **$0,001**.

---

## Struktur file

```
AI-Komputer/
├─ start.bat            ← klik ini untuk menjalankan
├─ server.js            ← server web + API
├─ lib/
│  ├─ ai.js             ← koneksi OpenRouter + loop tool calling
│  └─ tools.js          ← semua kemampuan (perintah, file, screenshot, dll.)
├─ public/
│  ├─ index.html
│  ├─ style.css
│  └─ app.js
├─ screenshots/         ← hasil screenshot
└─ .env                 ← API key & konfigurasi (jangan dibagikan)
```

---

## Jika ada masalah

| Masalah | Solusi |
|---|---|
| Perintah tidak dijalankan | Pastikan memakai alamat **http://127.0.0.1:8787** dengan judul **AI Komputer**. Aplikasi lama bernama "AI Full Control" di port 3000 sudah tidak dipakai. |
| Aplikasi tidak terbuka | Sebutkan nama aplikasi dengan jelas (mis. "Paint", "Notepad", "Chrome"). Lihat kartu langkah untuk pesan errornya. |
| Port 8787 dipakai | Ubah `PORT` di `.env`, lalu sesuaikan juga URL di `start.bat`. |
| "API key tidak valid" | Periksa `OPENROUTER_API_KEY` di `.env`. |
| "Saldo tidak cukup" | Ganti model atau isi saldo di openrouter.ai. |
| Perintah diblokir | Aktifkan toggle **Izinkan aksi berbahaya** (jika memang yakin). |
| Output berantakan | Coba ganti shell ke PowerShell di tab Terminal. |
| Node.js tidak ditemukan | Instal dari https://nodejs.org. |

---

## Catatan keamanan kunci API

API key tersimpan di file `.env` dan **hanya dipakai di komputer ini**. Jangan unggah `.env` ke internet atau membagikannya. Jika kunci pernah dikirim ke orang lain, buat kunci baru di [openrouter.ai/keys](https://openrouter.ai/keys) lalu ganti isi `.env`.
