# YuuZPime

Modifikasi AnimeDex oleh YuuZGilakPrompt. Source asli lengkap tersedia pada commit 3273c930d0306177ada58695999e90dc17acfe14. Lisensi MIT dan copyright TechShreyash dipertahankan.

Mode tamu, tanpa Supabase atau TMDB. Katalog memakai AniList GraphQL dan menyaring isAdult=false. Streaming lama TechZ tidak dijalankan; halaman detail dapat menampilkan tautan platform resmi yang tersedia. Tidak ada proxy URL atau unduhan video.

Lokal: pip install -r requirements.txt; python app.py. Vercel: framework Flask, default build/install settings. Health check: /healthz.
