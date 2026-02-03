# SIPAKAR LAPTOP

Sistem Pakar Diagnosa Kerusakan Laptop menggunakan metode **Forward Chaining** dan **Certainty Factor**.

## 📋 Deskripsi Sistem

SIPAKAR LAPTOP adalah aplikasi web berbasis sistem pakar yang dirancang untuk membantu pengguna mendiagnosa kerusakan pada laptop. Sistem ini menggunakan dua pendekatan utama:

1. **Diagnosa Berbasis Gejala** - Pengguna memilih gejala-gejala yang dialami, kemudian sistem akan menganalisis menggunakan algoritma Forward Chaining dan Certainty Factor untuk menentukan kemungkinan kerusakan.

2. **Diagnosa Berbasis Gambar (AI)** - Pengguna dapat mengupload foto atau mengambil gambar langsung menggunakan kamera untuk dianalisis oleh AI guna mengidentifikasi kerusakan fisik pada laptop.

### Metode yang Digunakan

- **Forward Chaining**: Metode inferensi yang dimulai dari fakta-fakta (gejala) untuk mencapai kesimpulan (kerusakan).
- **Certainty Factor (CF)**: Metode untuk menangani ketidakpastian dalam sistem pakar dengan memberikan nilai keyakinan pada setiap diagnosa.

Formula kombinasi CF:
```
CF_combine = CF1 + CF2 × (1 − CF1)
```

## ✨ Features

### Fitur Utama
- 🔍 **Diagnosa Gejala** - Pilih gejala dari daftar lengkap untuk mendapatkan diagnosa kerusakan
- 📸 **Diagnosa Gambar** - Upload atau ambil foto untuk analisis AI
- 🤖 **Analisis AI** - Validasi dan insight tambahan dari kecerdasan buatan
- 📊 **Certainty Factor** - Tingkat keyakinan diagnosa dalam persentase
- 💡 **Solusi Perbaikan** - Rekomendasi solusi untuk setiap kerusakan terdeteksi
- 📄 **Export PDF** - Cetak hasil diagnosa dalam format PDF

### Fitur Tambahan
- 🔐 **Autentikasi** - Sistem login dan registrasi pengguna
- 📜 **Riwayat Konsultasi** - Simpan dan lihat riwayat diagnosa sebelumnya
- 👤 **Role-Based Access** - Akses berbeda untuk Admin dan User
- 🌓 **Dark/Light Mode** - Tema tampilan yang dapat disesuaikan
- 📱 **Responsive Design** - Tampilan optimal di desktop dan mobile

### Panel Admin
- ⚙️ **Kelola Gejala** - CRUD data gejala kerusakan
- 🔧 **Kelola Kerusakan** - CRUD data jenis kerusakan dan solusi
- 📋 **Kelola Rule** - CRUD aturan relasi gejala-kerusakan dengan nilai CF
- 📈 **Dashboard** - Statistik dan overview sistem

## 🛠️ Tech Stack

### Frontend
- **React 18** - Library JavaScript untuk membangun UI
- **TypeScript** - Superset JavaScript dengan static typing
- **Vite** - Build tool modern untuk development yang cepat
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Komponen UI yang accessible dan customizable
- **Framer Motion** - Library animasi untuk React
- **React Router DOM** - Routing untuk Single Page Application
- **React Query** - State management untuk server state
- **React Hook Form** - Form handling dengan validasi
- **Zod** - Schema validation
- **Recharts** - Library chart untuk visualisasi data
- **Lucide React** - Icon library

### Backend
- **Lovable Cloud** - Backend-as-a-Service
- **PostgreSQL** - Database relasional
- **Edge Functions** - Serverless functions untuk AI processing
- **Row Level Security (RLS)** - Keamanan data di level database

### AI Integration
- **Gemini AI** - Model AI untuk analisis teks dan gambar
- **Vision API** - Analisis gambar untuk deteksi kerusakan fisik

### Tools
- **jsPDF** - Generate dokumen PDF
- **jspdf-autotable** - Tabel untuk PDF

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm atau bun

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd sipakar-laptop
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   bun install
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   # atau
   bun dev
   ```

4. **Buka browser**
   ```
   http://localhost:5173
   ```

## 📖 Cara Pakai (Usage)

### Untuk Pengguna Biasa

#### 1. Registrasi & Login
- Klik tombol **Masuk** di navbar
- Pilih **Daftar** untuk membuat akun baru
- Isi email dan password, lalu verifikasi email
- Login dengan akun yang sudah dibuat

#### 2. Diagnosa Berbasis Gejala
- Pilih menu **Konsultasi**
- Pilih tab **Pilih Gejala**
- Centang gejala-gejala yang dialami laptop Anda
- Klik **Proses Diagnosa**
- Lihat hasil diagnosa dengan tingkat keyakinan (CF)
- Klik **Analisis AI** untuk validasi tambahan
- Export hasil ke PDF jika diperlukan

#### 3. Diagnosa Berbasis Gambar
- Pilih menu **Konsultasi**
- Pilih tab **Upload Gambar**
- Upload foto atau gunakan kamera untuk mengambil gambar
- Klik **Analisis Gambar**
- Lihat hasil analisis AI dengan detail kerusakan terdeteksi

#### 4. Melihat Riwayat
- Pilih menu **Riwayat**
- Lihat semua konsultasi sebelumnya
- Filter berdasarkan tipe (Gejala/Gambar)
- Hapus riwayat yang tidak diperlukan

### Untuk Admin

#### Akses Panel Admin
- Login dengan akun admin
- Klik menu **Admin** di navbar

#### Kelola Data
- **Tab Gejala**: Tambah, edit, hapus data gejala
- **Tab Kerusakan**: Tambah, edit, hapus data kerusakan dan solusi
- **Tab Rule**: Kelola relasi gejala-kerusakan dengan nilai CF

## 👨‍💻 Tim Pengembang

| Nama | NIM | Kelas |
|------|-----|-------|
| **Muhammad Hidayat** | 220511088 | TI22D |

---

## 📄 Lisensi

Proyek ini dikembangkan sebagai tugas akademik.

## 🔗 Links

- **Preview**: [sipakar-laptop.lovable.app](https://sipakar-laptop.lovable.app)
