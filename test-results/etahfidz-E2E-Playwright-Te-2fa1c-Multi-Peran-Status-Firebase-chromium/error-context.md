# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: etahfidz.spec.ts >> E2E Playwright Tests - Sistem E-Tahfidz Pesantren Darul Kamal >> E2E 1: Menampilkan Halaman Login Resmi dengan Multi-Peran & Status Firebase
- Location: e2e/etahfidz.spec.ts:9:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Firebase Firestore: Terhubung')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Firebase Firestore: Terhubung') with timeout 5000ms
  - waiting for getByText('Firebase Firestore: Terhubung')

```

```yaml
- text: 
- heading "معهد دار الكمال" [level=1]
- paragraph: Sistem E-Tahfidz Darul Kamal
- text: Proteksi Keamanan Akses  Sistem Keamanan Aktif
- button "GAS API"
- button "Audit Logs"
- text: ID Pengguna / NIS
- 'textbox "Contoh: admin, pengasuh, ustadz, atau 12345"'
- text: Kata Sandi
- textbox "Masukkan kata sandi..."
- button ""
- checkbox "Ingat Sesi Perangkat" [checked]
- text: Ingat Sesi Perangkat
- button " Lupa Kata Sandi?"
- button "Masuk Aplikasi secara Aman "
- text: Masuk Cepat 4 Hak Akses Peran Mode Demo
- button " M. Asngad Admin TU"
- button " K.H. Sangidun Pengasuh"
- button " Ust. Abdullah Musyrif"
- button " M. Fauzan Santri (7 Juz)"
- paragraph: Sistem E-Tahfidz v2.2 • Proteksi Keamanan Keperanan & Verifikasi Reset Password
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('E2E Playwright Tests - Sistem E-Tahfidz Pesantren Darul Kamal', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/');
  7  |   });
  8  | 
  9  |   test('E2E 1: Menampilkan Halaman Login Resmi dengan Multi-Peran & Status Firebase', async ({ page }) => {
  10 |     // Verifikasi Judul Utama & Subtitle
  11 |     await expect(page.locator('h1')).toContainText('معهد دار الكمال');
  12 |     await expect(page.getByText('Sistem E-Tahfidz Darul Kamal')).toBeVisible();
  13 | 
  14 |     // Verifikasi Status Koneksi Firebase
> 15 |     await expect(page.getByText('Firebase Firestore: Terhubung')).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  16 | 
  17 |     // Verifikasi Tombol Quick Login Multi-Peran (4 Hak Akses)
  18 |     await expect(page.locator('button').filter({ hasText: 'M. Asngad' })).toBeVisible();
  19 |     await expect(page.locator('button').filter({ hasText: 'K.H. Sangidun' })).toBeVisible();
  20 |     await expect(page.locator('button').filter({ hasText: 'Ust. Abdullah' })).toBeVisible();
  21 |     await expect(page.locator('button').filter({ hasText: 'Fauzan' })).toBeVisible();
  22 |   });
  23 | 
  24 |   test('E2E 2: Login Pengasuh (K.H. Mohammad Sangidun) & Akses Maktab Pengasuhan', async ({ page }) => {
  25 |     // Login Cepat sebagai Pengasuh
  26 |     await page.locator('button').filter({ hasText: 'K.H. Sangidun' }).click();
  27 | 
  28 |     // Verifikasi Header Beranda Pengasuh
  29 |     await expect(page.locator('h3').filter({ hasText: 'Sangidun' })).toBeVisible();
  30 |     await expect(page.getByText('Pengasuh (K.H. Mohammad Sangidun)')).toBeVisible();
  31 | 
  32 |     // Navigasi ke Tab Taujiyah & Mauizhah Hasanah Pengasuh via Sidebar
  33 |     await page.locator('aside').locator('button').filter({ hasText: 'Taujiyah' }).click();
  34 | 
  35 |     // Verifikasi Judul Tab Taujiyah
  36 |     await expect(page.locator('h3').filter({ hasText: 'Taujiyah & Nasihat Pengasuh Pesantren' })).toBeVisible();
  37 |     await expect(page.getByText('Menjaga Keikhlasan Niat dalam Menghafal Kalamullah')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('E2E 3: Pengujian Modal Dialog Konfirmasi Keluar Akun (Logout Confirmation)', async ({ page }) => {
  41 |     // Login Cepat sebagai Admin
  42 |     await page.locator('button').filter({ hasText: 'M. Asngad' }).click();
  43 |     await expect(page.getByText('M. Asngad (Admin)')).toBeVisible();
  44 | 
  45 |     // Klik tombol Keluar Akun di sidebar desktop
  46 |     await page.locator('aside').locator('button').filter({ hasText: 'Keluar Akun' }).click();
  47 | 
  48 |     // Verifikasi Modal Konfirmasi Keluar Akun Muncul
  49 |     await expect(page.getByText('Konfirmasi Keluar Akun')).toBeVisible();
  50 | 
  51 |     // Klik "Batal / Tetap Masuk"
  52 |     await page.locator('button').filter({ hasText: 'Batal / Tetap Masuk' }).click();
  53 | 
  54 |     // Verifikasi Modal Tertutup & Sesi Admin Tetap Aktif
  55 |     await expect(page.getByText('Konfirmasi Keluar Akun')).not.toBeVisible();
  56 |     await expect(page.getByText('Dashboard Eksekutif Lembaga')).toBeVisible();
  57 | 
  58 |     // Klik Keluar Akun Lagi & Konfirmasi "Ya, Keluar Akun"
  59 |     await page.locator('aside').locator('button').filter({ hasText: 'Keluar Akun' }).click();
  60 |     await page.locator('button').filter({ hasText: 'Ya, Keluar Akun' }).click();
  61 | 
  62 |     // Verifikasi Pengguna Kembali ke Menu Login
  63 |     await expect(page.getByText('Masuk Aplikasi')).toBeVisible();
  64 |   });
  65 | 
  66 |   test('E2E 4: Login Admin (M. Asngad) & Akses Master Data Santri & Kelas', async ({ page }) => {
  67 |     // Login Cepat sebagai Admin
  68 |     await page.locator('button').filter({ hasText: 'M. Asngad' }).click();
  69 | 
  70 |     // Verifikasi Dashboard Admin
  71 |     await expect(page.getByText('Dashboard Eksekutif Lembaga')).toBeVisible();
  72 | 
  73 |     // Navigasi ke Data Santri via Sidebar Admin
  74 |     await page.locator('aside').locator('button').filter({ hasText: 'Kelola Data Santri' }).click();
  75 |     await expect(page.getByText('Muhammad Fauzan Al-Hafidz')).toBeVisible();
  76 | 
  77 |     // Navigasi ke Kelas & Mapel via Sidebar Admin
  78 |     await page.locator('aside').locator('button').filter({ hasText: 'Kelas & Mata Pelajaran' }).click();
  79 |     await expect(page.getByText('Tahfidz Ula (Tingkat Dasar)')).toBeVisible();
  80 |   });
  81 | 
  82 |   test('E2E 5: Login Santri (Muhammad Fauzan) & Ruang Belajar Hafalan', async ({ page }) => {
  83 |     // Login Cepat sebagai Santri
  84 |     await page.locator('button').filter({ hasText: 'Fauzan' }).click();
  85 | 
  86 |     // Verifikasi Ruang Belajar Santri
  87 |     await expect(page.getByText('Ruang Belajar & Hafalan Pribadi')).toBeVisible();
  88 | 
  89 |     // Navigasi ke Tab Peta 30 Juz
  90 |     await page.locator('button').filter({ hasText: 'Peta 30 Juz Saya' }).click();
  91 |     await expect(page.getByText('Peta Progres 30 Juz Saya')).toBeVisible();
  92 |   });
  93 | 
  94 | });
  95 | 
```