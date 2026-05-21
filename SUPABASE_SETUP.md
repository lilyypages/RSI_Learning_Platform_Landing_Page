# SIPANDA — Panduan Setup Langkah demi Langkah

> **Sistem Informasi Pembelajaran Adaptif berbasis Analitik Kemajuan Siswa**

---

## Ringkasan Alur

```
Buat Supabase Project → Copy Kredensial → Isi .env → Setup DB → Setup Auth → Jalankan Backend → Testing
```

---

## Langkah 1: Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Login pakai GitHub
3. Klik **New project**
4. Isi:
   - **Name**: `sipanda`
   - **Database Password**: buat sendiri (simpan! akan dipakai nanti)
   - **Region**: `Singapore` (ap-southeast-1)
   - **Pricing Plan**: Free
5. Klik **Create new project**
6. Tunggu ~2 menit sampai selesai

---

## Langkah 2: Ambil Kredensial dari Supabase

Buka **Project Settings > API**:

| Variabel | Ambil dari sini |
|----------|----------------|
| `SUPABASE_URL` | **Project URL** (format: `https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | **anon public** (baris pertama) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (baris kedua) |

Buka **Project Settings > Database > Connection string**:
- Pilih tab **URI**
- Pilih **Pooling**
- Copy string URL-nya
- **Ganti `[YOUR-PASSWORD]`** dengan password yang dibuat di Langkah 1

---

## Langkah 3: Isi File `.env`

Edit `backend/.env` dengan kredensial dari Langkah 2:

```env
SUPABASE_URL=https://abcdefg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
SUPABASE_DB_URL=postgresql+psycopg2://postgres.abcdefg:password123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

---

## Langkah 4: Setup Database (PostgreSQL OLTP Schema)

1. Buka Supabase Dashboard
2. Klik **SQL Editor** di sidebar kiri
3. Klik **New query**
4. Buka file `db/init/01_snowflake_schema.sql`
5. **Copy seluruh isinya** → paste ke SQL Editor
6. Klik **Run** (tombol putih)
7. Tunggu sampai sukses (cek tabel di **Table Editor**)

> Database + tabel siap.

---

## Langkah 5: Setup Authentication

1. Buka **Authentication > Providers**
2. Pastikan **Email** di-*enable*
3. Buka **Authentication > Settings**
4. Cari **"Confirm email"** → **matikan** (agar testing tanpa verifikasi email)
5. Klik **Save**

---

## Langkah 6: Jalankan Backend

```bash
# Pindah ke direktori proyek web
cd /home/archian/kuliah/sm4/rsi/web

# Build & jalankan
docker compose up -d --build
```

Cek apakah berjalan:

```bash
docker compose ps
```

Hasilnya harus seperti ini:

```
NAME                IMAGE               STATUS              PORTS
sipanda-api         web-backend         Up                  0.0.0.0:8000->8000/tcp
```

Buka browser: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Langkah 7: Testing API

### a. Cek health

```bash
curl http://localhost:8000/health
```

Response: `{"status": "healthy"}`

### b. Register user

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"siswa@test.com","password":"rahasia123","full_name":"Budi Santoso"}'
```

### c. Login

```bash
curl -X POST http://localhost:8000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"siswa@test.com","password":"rahasia123"}'
```

Simpan `access_token` dari response.

### d. Akses endpoint terproteksi

```bash
curl http://localhost:8000/progress/dashboard \
  -H "Authorization: Bearer <token_dari_signin>"
```

---

## Langkah 8: (Opsional) Cek Data di Supabase

Buka **Table Editor** di Supabase Dashboard:
- https://supabase.com/dashboard/project/[REF]/editor

Cek tabel-tabel yang sudah terbuat:
- `users`
- `subjects`
- `parents`
- `teachers`
- `principals`
- `classes`
- `students`
- `class_subjects`
- `materials`
- `videos`
- `questions`
- `student_progress`
- `quiz_sessions`
- `quiz_answers`
- `video_watches`
- `point_logs`
- `weekly_reports`
- `messages`
- `notifications`

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `docker compose` command not found | Install Docker Desktop / `sudo apt install docker-compose-plugin` |
| Connection refused (port 8000) | `docker compose logs -f` untuk lihat error |
| `psycopg2` error SSL | Di Supabase DB URL, pakai `?sslmode=require` di akhir |
| Auth return 401 terus | Cek `SUPABASE_ANON_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` di .env |
| Tabel tidak terbuat | Jalanin ulang SQL di SQL Editor Supabase |
