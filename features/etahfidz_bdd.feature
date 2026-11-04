# language: id
Fitur: Sistem Manajemen E-Tahfidz Pesantren Darul Kamal
  Sebagai pengguna pesantren (Admin, Pengasuh, Musyrif, atau Santri)
  Saya ingin mengakses fitur sesuai peran saya dengan keamanan dan kenyamanan tinggi
  Agar pengelolaan hafalan Al-Qur'an dan pengasuhan santri berjalan tertib dan terstruktur.

  Latar Belakang:
    Ganda Pengguna terdaftar dalam sistem E-Tahfidz Pesantren Darul Kamal
    Dan Server database E-Tahfidz siap memproses permintaan

  @keamanan @login
  Skenario: Pemilihan Peran Akses Cepat Hanya di Halaman Login
    Ketika Saya berada di Halaman Login E-Tahfidz
    Maka Saya dapat melihat pilihan tombol Cepat Peran untuk Admin, Pengasuh, Musyrif, dan Santri
    Dan Setelah Saya berhasil masuk ke Dashboard
    Maka Tombol switcher Cepat Peran di atas header aplikasi disembunyikan (hidden) untuk menjaga privasi sesi

  @keamanan @proteksi
  Skenario: Sistem Keamanan Proteksi Login dan Penguncian Akun Bertahap
    Ketika Saya melakukan percobaan login dengan kata sandi yang salah sebanyak 2 kali
    Maka Sistem secara otomatis mengaktifkan Tantangan Keamanan Anti-Bot (CAPTCHA Math Challenge)
    Ketika Saya melakukan kesalahan kata sandi ke-3 secara berturut-turut
    Maka Sistem mengunci sesi login sementara selama 30 detik dan mencatat kejadian pada Audit Log Keamanan

  @keamanan @resetpass
  Skenario: Verifikasi Identitas dan Reset Kata Sandi Akun Pengguna
    Ketika Saya menekan tombol "Lupa Kata Sandi?" pada halaman login
    Maka Sistem menampilkan Modal Dialog Verifikasi Identitas Akun
    Ketika Saya memilih peran "Santri" dan menginput NIS "12345" beserta Nama Verifikasi
    Maka Identitas terverifikasi dan Sistem menampilkan Form Pembuatan Kata Sandi Baru
    Ketika Saya menginput Kata Sandi Baru minimal 6 karakter dan menyimpan perubahan
    Maka Kata sandi baru tersimpan secara aman dan Saya dapat langsung login dengan kata sandi baru tersebut

  @keamanan @logout
  Skenario: Konfirmasi Dialog Modal Sebelum Keluar Sesi untuk Semua Peran
    Dengan Saya sudah login ke Dashboard E-Tahfidz sebagai pengguna "Pengasuh"
    Ketika Saya menekan tombol "Keluar" atau tombol "Logout" di navigasi
    Maka Sistem menampilkan Modal Dialog Konfirmasi Keluar dengan pertanyaan "Apakah Anda yakin ingin keluar?"
    Ketika Saya memilih "Batal / Tetap di Aplikasi"
    Maka Dialog konfirmasi tertutup dan Saya tetap berada di Halaman Dashboard
    Ketika Saya menekan "Keluar" dan memilih "Ya, Keluar Sesi"
    Maka Sesi Saya diakhiri dan Saya dikembalikan secara aman ke Halaman Login

  @admin @masterdata
  Skenario: Pengelolaan Data Santri dan Kelompok Halaqah oleh Admin
    Dengan Saya login sebagai "Administrator Utama"
    Ketika Saya membuka menu "Kelola Data Santri"
    Maka Saya dapat melihat daftar seluruh santri aktif beserta status hafalan dan halaqahnya
    Ketika Saya menambahkan santri baru dengan NIS "2026099" dan nama "Ahmad Zaki"
    Maka Santri baru berhasil tersimpan dan langsung terdaftar di sistem

  @pengasuh @taujiyah
  Skenario: Penyampaian Taujiyah & Mau'izhah oleh Pengasuh Kiai
    Dengan Saya login sebagai "Pengasuh Pesantren"
    Ketika Saya mengakses menu "Taujiyah & Mau'izhah"
    Maka Saya melihat daftar nasehat dan motivasi Qur'ani untuk seluruh santri
    Ketika Saya mempublikasikan taujiyah baru berjudul "Keutamaan Istiqamah Muroja'ah"
    Maka Taujiyah tersebut langsung tampil di dashboard seluruh Santri dan Musyrif

  @musyrif @setoran
  Skenario: Input Setoran Hafalan Baru Santri oleh Musyrif / Ustadz
    Dengan Saya login sebagai "Musyrif / Ustadz Halaqah"
    Ketika Saya memilih santri "Muhammad Fauzan" pada menu "Input Setoran Hafalan"
    Dan Saya menginput Surah "Al-Baqarah" ayat 1 hingga 20 dengan predikat "Mumtaz (Sangat Baik)"
    Maka Progress hafalan santri bertambah dan rekap riwayat setoran diperbarui secara otomatis

  @santri @progres
  Skenario: Pemantauan Peta Progres 30 Juz dan Jadwal Ziyadah oleh Santri
    Dengan Saya login sebagai "Santri"
    Ketika Saya memilih menu "Peta 30 Juz Saya"
    Maka Saya dapat melihat peta visual 30 Juz lengkap dengan status juz mutqin, ziyadah, dan belum dihafal
    Dan Saya dapat mengunduh Laporan Progres Hafalan dalam format PDF
