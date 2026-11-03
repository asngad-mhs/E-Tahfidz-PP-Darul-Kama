import { test, expect } from '@playwright/test';

test.describe('E2E Playwright Tests - Sistem E-Tahfidz Pesantren Darul Kamal', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E 1: Menampilkan Halaman Login Resmi dengan Multi-Peran & Status Firebase', async ({ page }) => {
    // Verifikasi Judul Utama & Subtitle
    await expect(page.locator('h1')).toContainText('معهد دار الكمال');
    await expect(page.getByText('Sistem E-Tahfidz Darul Kamal')).toBeVisible();

    // Verifikasi Status Koneksi Firebase
    await expect(page.getByText('Firebase Firestore: Terhubung')).toBeVisible();

    // Verifikasi Tombol Quick Login Multi-Peran (4 Hak Akses)
    await expect(page.locator('button').filter({ hasText: 'M. Asngad' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'K.H. Sangidun' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Ust. Abdullah' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Fauzan' })).toBeVisible();
  });

  test('E2E 2: Login Pengasuh (K.H. Mohammad Sangidun) & Akses Maktab Pengasuhan', async ({ page }) => {
    // Login Cepat sebagai Pengasuh
    await page.locator('button').filter({ hasText: 'K.H. Sangidun' }).click();

    // Verifikasi Header Beranda Pengasuh
    await expect(page.locator('h3').filter({ hasText: 'Sangidun' })).toBeVisible();
    await expect(page.getByText('Pengasuh (K.H. Mohammad Sangidun)')).toBeVisible();

    // Navigasi ke Tab Taujiyah & Mauizhah Hasanah Pengasuh via Sidebar
    await page.locator('aside').locator('button').filter({ hasText: 'Taujiyah' }).click();

    // Verifikasi Judul Tab Taujiyah
    await expect(page.locator('h3').filter({ hasText: 'Taujiyah & Nasihat Pengasuh Pesantren' })).toBeVisible();
    await expect(page.getByText('Menjaga Keikhlasan Niat dalam Menghafal Kalamullah')).toBeVisible();
  });

  test('E2E 3: Pengujian Modal Dialog Konfirmasi Keluar Akun (Logout Confirmation)', async ({ page }) => {
    // Login Cepat sebagai Admin
    await page.locator('button').filter({ hasText: 'M. Asngad' }).click();
    await expect(page.getByText('M. Asngad (Admin)')).toBeVisible();

    // Klik tombol Keluar Akun di sidebar desktop
    await page.locator('aside').locator('button').filter({ hasText: 'Keluar Akun' }).click();

    // Verifikasi Modal Konfirmasi Keluar Akun Muncul
    await expect(page.getByText('Konfirmasi Keluar Akun')).toBeVisible();

    // Klik "Batal / Tetap Masuk"
    await page.locator('button').filter({ hasText: 'Batal / Tetap Masuk' }).click();

    // Verifikasi Modal Tertutup & Sesi Admin Tetap Aktif
    await expect(page.getByText('Konfirmasi Keluar Akun')).not.toBeVisible();
    await expect(page.getByText('Dashboard Eksekutif Lembaga')).toBeVisible();

    // Klik Keluar Akun Lagi & Konfirmasi "Ya, Keluar Akun"
    await page.locator('aside').locator('button').filter({ hasText: 'Keluar Akun' }).click();
    await page.locator('button').filter({ hasText: 'Ya, Keluar Akun' }).click();

    // Verifikasi Pengguna Kembali ke Menu Login
    await expect(page.getByText('Masuk Aplikasi')).toBeVisible();
  });

  test('E2E 4: Login Admin (M. Asngad) & Akses Master Data Santri & Kelas', async ({ page }) => {
    // Login Cepat sebagai Admin
    await page.locator('button').filter({ hasText: 'M. Asngad' }).click();

    // Verifikasi Dashboard Admin
    await expect(page.getByText('Dashboard Eksekutif Lembaga')).toBeVisible();

    // Navigasi ke Data Santri via Sidebar Admin
    await page.locator('aside').locator('button').filter({ hasText: 'Kelola Data Santri' }).click();
    await expect(page.getByText('Muhammad Fauzan Al-Hafidz')).toBeVisible();

    // Navigasi ke Kelas & Mapel via Sidebar Admin
    await page.locator('aside').locator('button').filter({ hasText: 'Kelas & Mata Pelajaran' }).click();
    await expect(page.getByText('Tahfidz Ula (Tingkat Dasar)')).toBeVisible();
  });

  test('E2E 5: Login Santri (Muhammad Fauzan) & Ruang Belajar Hafalan', async ({ page }) => {
    // Login Cepat sebagai Santri
    await page.locator('button').filter({ hasText: 'Fauzan' }).click();

    // Verifikasi Ruang Belajar Santri
    await expect(page.getByText('Ruang Belajar & Hafalan Pribadi')).toBeVisible();

    // Navigasi ke Tab Peta 30 Juz
    await page.locator('button').filter({ hasText: 'Peta 30 Juz Saya' }).click();
    await expect(page.getByText('Peta Progres 30 Juz Saya')).toBeVisible();
  });

});
