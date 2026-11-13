# Mocean: catatan lanjut di rumah

13 November 2026. Versi yang selalu terbaru (bisa diedit dan dikomentari): https://claude.ai/artifact/S5BUU74cqWYiYG8MXKhZP1

## Status sekarang

Semua kode sudah di-commit dan di-push ke GitHub. Yang tersisa: database demo di Vercel, dan PR website dari branch yang benar. Folder di laptop (`D:\Next.js Data\mocean`) sedang ada di branch `seo-surf-diving-content`.

| Branch | Isi | Status |
| --- | --- | --- |
| `main` | Website live (mocean-six.vercel.app). Tombol Book masih ke Cloudbeds. | Tidak diubah |
| `seo-surf-diving-content` | Lanjutan `remove-local-tours`: teks surf dan diving, panduan Northern Rights, **halaman tur dikembalikan**, tombol booking di halaman tur dihapus | Commit terakhir `2c1388b`, sudah di-push |
| `remove-local-tours` | 5 halaman tur dihapus dan diarsipkan | Commit `d9a1a82`, **sudah tergantikan**, jangan dibuat PR |
| `booking-native` | Booking system sendiri: admin, database, mode Trial, Prices, Rooms, Guide, Payments, contoh booking | Sudah di-push, preview Vercel sudah jadi tapi **belum ada database** |

Preview booking: https://mocean-git-booking-native-sapiora-volaris.vercel.app/admin/ (dikunci login Vercel tim `sapiora-volaris`). Di website utama `/admin/` memang 404, karena booking belum digabung ke `main`.

## Yang masih kurang

Tujuh langkah ini harus beres sebelum owner datang Rabu, 18 November 2026. Kerjakan berurutan.

- [ ] Buat PR website dari branch `seo-surf-diving-content` (akun GitHub Muthiakartika), cek preview-nya, lalu merge. Jangan dari `remove-local-tours` (lihat bagian Halaman tur lokal).
- [ ] Siapkan database Neon dan variabel trial di Vercel (bagian Setup demo, langkah A dan B).
- [ ] Isi tabel database dan buat login untuk owner dan tiap staff (langkah C).
- [ ] Redeploy preview `booking-native`, buka `/admin/`, lalu di Guide klik **Add sample bookings** (langkah D).
- [ ] Buat link Share supaya owner bisa membuka preview tanpa akun Vercel.
- [ ] Coba sendiri dari HP: login, ubah harga di Prices, isi tanggal musim, konfirmasi satu contoh booking.
- [ ] Siapkan jawaban untuk owner soal biaya: Cloudbeds per tahun dibanding channel manager untuk Booking.com dan Expedia.

## Menjalankan booking system di laptop

Booking system hanya ada di branch `booking-native`. Jalankan dalam mode Trial supaya tidak ada email yang terkirim. Semua perintah di terminal VS Code (PowerShell), di folder `D:\Next.js Data\mocean`.

1. Pastikan tidak ada perubahan yang belum di-commit: `git status` harus bersih.
2. Pindah ke branch booking: `git switch booking-native`
3. Nyalakan server dalam mode Trial: `$env:BOOKING_PROVIDER="native"; $env:BOOKING_TRIAL="1"; npm run dev`
4. Buka http://localhost:3012/admin/. Login lokal: `DEV_ADMIN` di `src/lib/db/dev-admin.ts`.
5. Di menu **Guide**, klik **Add sample bookings** supaya admin terisi data. Halaman tamu ada di http://localhost:3012/book/.
6. Selesai: `Ctrl+C`, lalu kembali ke website dengan `git switch seo-surf-diving-content` (atau `main`).

Kalau `npm run build` gagal dengan error di `.next/dev/types`, hapus folder `.next/dev`: isinya cache server dev branch lain. Tes otomatis: `npm test` (72 tes, semua lolos per 13 November).

## Setup demo online (Neon dan Vercel)

Preview `booking-native` sudah ter-build di Vercel. Ia hanya butuh database sendiri dan beberapa variabel. Semua langkah di Vercel dikerjakan dari akun tim `sapiora-volaris`, project **mocean**.

**A. Database trial (Neon)**

1. Settings > Functions: catat **Function Region** (biasanya Washington, D.C., iad1).
2. Storage > Create Database > **Neon**. Region: sama dengan Function Region (iad1 = US East, N. Virginia). Plan: Free. Nama: `mocean-trial`.
3. Di jendela Connect Project: centang **Preview saja**. **Jangan** centang "Create database branch for deployment". Prefix dikosongkan.
4. Cek di Settings > Environment Variables: ada `DATABASE_URL` dan `DATABASE_URL_UNPOOLED` berlabel Preview.

**B. Variabel trial** (Environment: Preview, branch `booking-native`)

| Key | Value |
| --- | --- |
| `BOOKING_PROVIDER` | `native` |
| `BOOKING_TRIAL` | `1` |
| `ADMIN_SESSION_SECRET` | teks acak |
| `BOOKING_LINK_SECRET` | teks acak lain |
| `BOOKING_TRIAL_EMAIL` | email tim (opsional; kosong = tidak ada email sama sekali) |

Teks acak dibuat dengan perintah ini (jalankan dua kali): `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

**C. Isi database dan buat login (di laptop, branch `booking-native`)**

1. Vercel > Storage > mocean-trial > tab `.env.local` > Show secret. Salin baris `DATABASE_URL` dan `DATABASE_URL_UNPOOLED`.
2. Tempel keduanya ke file baru `.env.trial` di folder project. File ini tidak ikut ke Git.
3. Buat tabel dan kamar awal: `npx tsx --env-file=.env.trial scripts/db-setup.ts`
4. Buat login, satu kali per orang: `npx tsx --env-file=.env.trial scripts/admin-create.ts email@domain.com`. Password hanya tampil sekali, jadi langsung catat.

**D. Redeploy dan buka**

1. Deployments > deployment `booking-native` terbaru > ⋯ > **Redeploy**. Variabel baru hanya terpakai di deployment baru.
2. Buka https://mocean-git-booking-native-sapiora-volaris.vercel.app/admin/, login, lalu di Guide klik **Add sample bookings**.
3. Untuk owner: buat link lewat tombol **Share** di halaman deployment, atau matikan Vercel Authentication untuk Preview di Settings > Deployment Protection.

## Halaman tur lokal (keputusan berubah)

Penghapusan halaman tur dibatalkan. Branch `seo-surf-diving-content` (commit `bedc1b2` dan `2c1388b`, 13 November) mengembalikan kelima halaman tur dan hanya menghapus tombol booking di halaman itu, sama seperti di WordPress.

1. Jangan buat PR dari `remove-local-tours`: isinya sudah tergantikan.
2. Kalau belum ada PR-nya, login GitHub sebagai Muthiakartika lalu buka https://github.com/Muthiakartika/mocean/compare/main...seo-surf-diving-content?expand=1
3. Cek preview Vercel dari PR itu: halaman tur tampil tanpa tombol "Book ...", halaman surf dan diving dengan teks baru.
4. Merge ke `main`. Website live berubah setelah Vercel selesai deploy.

Kalau owner nanti ingin halaman tur dihapus lagi, versi penghapusannya ada di commit `d9a1a82` (branch `remove-local-tours`).

## Menunggu owner dan belum dites

Owner tetap memakai Cloudbeds sampai kontraknya habis (sekitar Maret/April 2027). Booking system ini dinilai dari dua hal: mudah dipakai staff, dan mudah mengatur harga per musim.

**Perlu jawaban owner**

- Tanggal high season dan shoulder season. Selama kosong, semua malam dihitung harga low season.
- Jumlah kamar per tipe, dan kapasitas tamu Deluxe: website bilang 2 orang, Cloudbeds menawarkan 3.
- OTA: sekarang Cloudbeds yang menyambung kamar ke Booking.com dan Expedia. Kalau pindah penuh, perlu channel manager berbayar. Tanyakan berapa biaya Cloudbeds per tahun dan OTA mana saja yang dipakai.
- Alamat email untuk pemberitahuan booking, dan isi email ke tamu.

**Belum dites**

- Email sungguhan ke tamu dan owner, termasuk apakah masuk spam.
- Dua orang memesan kamar terakhir bersamaan, di database Neon yang sebenarnya.
- Pembayaran online Xendit: ditunda, belum pernah dicoba.

## Jangan lupa

- Alamat database dan password jangan ditempel di chat. Simpan di `.env.trial` (tidak masuk Git) dan di Vercel saja.
- `BOOKING_TRIAL` dan `BOOKING_PROVIDER` hanya untuk **Preview** branch `booking-native`, jangan pernah di Production.
- Tombol Book di website tetap ke Cloudbeds sampai owner memutuskan pindah.
- `.env.local` berisi kunci SendGrid asli. Kalau menjalankan server `native` tanpa mode Trial, email sungguhan bisa terkirim ke tamu tes.
- Sebelum pindah branch, cek `git status` dulu, harus bersih.
