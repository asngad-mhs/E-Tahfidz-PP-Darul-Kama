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

Locator: locator('button').filter({ hasText: 'Muhammad Fauzan' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('button').filter({ hasText: 'Muhammad Fauzan' }) with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'Muhammad Fauzan' })

```

```yaml
- text: 
- heading "معهد دار الكمال" [level=1]
- paragraph: Sistem E-Tahfidz Darul Kamal
- paragraph: Pondok Pesantren Darul Kamal
- text: " Firebase Firestore: Terhubung"
- button " Sheets API"
- text: ID Pengguna / NIS
- 'textbox "Contoh: admin atau 12345"'
- text: Kata Sandi
- textbox "Masukkan kata sandi..."
- button "Masuk Aplikasi "
- paragraph: Masuk Cepat Multi-Peran (4 Hak Akses)
- button " M. Asngad Admin TU"
- button " K.H. Sangidun Pengasuh"
- button " Ust. Abdullah Ustadz / Musyrif"
- button " M. Fauzan Santri (7 Juz)"
- paragraph: Sistem E-Tahfidz v2.1 • Pondok Pesantren Darul Kamal
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
  15 |     await expect(page.getByText('Firebase Firestore: Terhubung')).toBeVisible();
  16 | 
  17 |     // Verifikasi Tombol Quick Login Multi-Peran
  18 |     await expect(page.locator('button').filter({ hasText: 'M. Asngad' })).toBeVisible();
  19 |     await expect(page.locator('button').filter({ hasText: 'K.H. Sangidun' })).toBeVisible();
  20 |     await expect(page.locator('button').filter({ hasText: 'Ust. Abdullah' })).toBeVisible();
> 21 |     await expect(page.locator('button').filter({ hasText: 'Muhammad Fauzan' })).toBeVisible();
     |                                                                                 ^ Error: expect(locator).toBeVisible() failed
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
  32 |     // Navigasi ke Tab Taujiyah & Mauizhah Hasanah Pengasuh
  33 |     await page.locator('button').filter({ hasText: 'Taujiyah Pengasuh' }).click();
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
  50 |     await expect(page.getByText('M. Asngad')).toBeVisible();
  51 | 
  52 |     // Klik "Batal / Tetap Masuk"
  53 |     await page.locator('button').filter({ hasText: 'Batal / Tetap Masuk' }).click();
  54 | 
  55 |     // Verifikasi Modal Tertutup & Sesi Admin Tetap Aktif
  56 |     await expect(page.getByText('Konfirmasi Keluar Akun')).not.toBeVisible();
  57 |     await expect(page.getByText('Dashboard Eksekutif Lembaga')).toBeVisible();
  58 | 
  59 |     // Klik Keluar Akun Lagi & Konfirmasi "Ya, Keluar Akun"
  60 |     await page.locator('aside').locator('button').filter({ hasText: 'Keluar Akun' }).click();
  61 |     await page.locator('button').filter({ hasText: 'Ya, Keluar Akun' }).click();
  62 | 
  63 |     // Verifikasi Pengguna Kembali ke Menu Login
  64 |     await expect(page.getByText('Masuk Aplikasi')).toBeVisible();
  65 |   });
  66 | 
  67 |   test('E2E 4: Login Admin (M. Asngad) & Akses Master Data Santri & Kelas', async ({ page }) => {
  68 |     // Login Cepat sebagai Admin
  69 |     await page.locator('button').filter({ hasText: 'M. Asngad' }).click();
  70 | 
  71 |     // Verifikasi Dashboard Admin
  72 |     await expect(page.getByText('Dashboard Eksekutif Lembaga')).toBeVisible();
  73 | 
  74 |     // Navigasi ke Data Santri
  75 |     await page.locator('button').filter({ hasText: 'Data Santri' }).click();
  76 |     await expect(page.getByText('Muhammad Fauzan Al-Hafidz')).toBeVisible();
  77 | 
  78 |     // Navigasi ke Kelas & Mapel
  79 |     await page.locator('button').filter({ hasText: 'Kelas & Mapel' }).click();
  80 |     await expect(page.getByText('Tahfidz Ula (Tingkat Dasar)')).toBeVisible();
  81 |   });
  82 | 
  83 |   test('E2E 5: Login Santri (Muhammad Fauzan) & Ruang Belajar Hafalan', async ({ page }) => {
  84 |     // Login Cepat sebagai Santri
  85 |     await page.locator('button').filter({ hasText: 'Muhammad Fauzan' }).click();
  86 | 
  87 |     // Verifikasi Ruang Belajar Santri
  88 |     await expect(page.getByText('Ruang Belajar & Hafalan Pribadi')).toBeVisible();
  89 |     await expect(page.getByText('Peta Progres 30 Juz Saya')).toBeVisible();
  90 |   });
  91 | 
  92 | });
  93 | 
```