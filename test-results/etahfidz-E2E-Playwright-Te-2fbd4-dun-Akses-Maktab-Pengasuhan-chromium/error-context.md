# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: etahfidz.spec.ts >> E2E Playwright Tests - Sistem E-Tahfidz Pesantren Darul Kamal >> E2E 2: Login Pengasuh (K.H. Mohammad Sangidun) & Akses Maktab Pengasuhan
- Location: e2e/etahfidz.spec.ts:24:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Taujiyah' }) resolved to 3 elements:
    1) <button class="w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs text-emerald-100 hover:bg-emerald-800/50">…</button> aka getByRole('button', { name: ' Taujiyah & Mau\'izhah' })
    2) <button class="bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition">…</button> aka getByRole('button', { name: ' Terbitkan Taujiyah' })
    3) <button class="flex-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs">…</button> aka getByRole('button', { name: '+ Terbitkan Taujiyah Baru' })

Call log:
  - waiting for locator('button').filter({ hasText: 'Taujiyah' })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - complementary [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]: 
      - heading "دار الكمال" [level=1] [ref=e9]
      - paragraph [ref=e10]: E-Tahfidz Darul Kamal
      - generic [ref=e12]:
        - generic [ref=e13]: 
        - text: K.H. Mohammad Sangidun (Pengasuh)
    - navigation [ref=e14]:
      - generic [ref=e15]: Maktab Pengasuhan Pesantren
      - button " Maktab Pengasuhan" [ref=e16] [cursor=pointer]:
        - generic [ref=e17]: 
        - generic [ref=e18]: Maktab Pengasuhan
      - button " Taujiyah & Mau'izhah 4" [ref=e19] [cursor=pointer]:
        - generic [ref=e20]: 
        - generic [ref=e21]: Taujiyah & Mau'izhah
        - generic [ref=e22]: "4"
      - button " Otorisasi Khotmil Qur'an 1 Calon" [ref=e23] [cursor=pointer]:
        - generic [ref=e24]: 
        - generic [ref=e25]: Otorisasi Khotmil Qur'an
        - generic [ref=e26]: 1 Calon
      - button " Peta 30 Juz Santri" [ref=e27] [cursor=pointer]:
        - generic [ref=e28]: 
        - generic [ref=e29]: Peta 30 Juz Santri
      - button " Audit & Rekap Nilai Tasmi' 5" [ref=e30] [cursor=pointer]:
        - generic [ref=e31]: 
        - generic [ref=e32]: Audit & Rekap Nilai Tasmi'
        - generic [ref=e33]: "5"
      - button " Kelas & Beban Asatidz 4 Kls" [ref=e34] [cursor=pointer]:
        - generic [ref=e35]: 
        - generic [ref=e36]: Kelas & Beban Asatidz
        - generic [ref=e37]: 4 Kls
      - button " Data Lengkap Santri 6" [ref=e38] [cursor=pointer]:
        - generic [ref=e39]: 
        - generic [ref=e40]: Data Lengkap Santri
        - generic [ref=e41]: "6"
      - button " Kesehatan Halaqah" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: 
        - generic [ref=e44]: Kesehatan Halaqah
    - generic [ref=e45]:
      - generic [ref=e46]:
        - generic [ref=e47]: K
        - generic [ref=e48]:
          - paragraph [ref=e49]: K.H. Mohammad Sangidun, S.Ag., Al-Hafidz
          - paragraph [ref=e50]: Pengasuh Pondok Pesantren
      - button "Keluar Akun " [ref=e51] [cursor=pointer]:
        - text: Keluar Akun
        - generic [ref=e52]: 
  - text:  
  - main [ref=e53]:
    - generic [ref=e54]:
      - generic [ref=e55]:
        - generic [ref=e56]:
          - generic [ref=e57]: E-Tahfidz Pesantren Darul Kamal
          - generic [ref=e58]: "Peran: Pengasuh (K.H. Mohammad Sangidun)"
        - heading "Maktab Pengasuhan & Kebijakan Tahfidz" [level=2] [ref=e59]
        - paragraph [ref=e60]: Pengawasan eksekutif, pembinaan ruhiyah taujiyah, serta pengesahan ijazah sanad Khotmil Qur'an 30 Juz.
      - generic [ref=e61]:
        - button " Terbitkan Taujiyah" [ref=e62] [cursor=pointer]:
          - generic [ref=e63]: 
          - generic [ref=e64]: Terbitkan Taujiyah
        - button " Otorisasi Khotmil Qur'an" [ref=e65] [cursor=pointer]:
          - generic [ref=e66]: 
          - generic [ref=e67]: Otorisasi Khotmil Qur'an
        - button " Utilitas & Murattal" [ref=e68] [cursor=pointer]:
          - generic [ref=e69]: 
          - generic [ref=e70]: Utilitas & Murattal
    - generic [ref=e72]:
      - generic [ref=e73]:
        - generic [ref=e74]:
          - generic [ref=e75]:
            - generic [ref=e76]:
              - generic [ref=e77]: 
              - text: Maktab Pengasuhan Pesantren
            - generic [ref=e78]: Tahun Ajaran 1447-1448 H / 2026 M
            - generic [ref=e79]: Pimpinan Lembaga & Pembina Sanad
          - heading "Ahlan wa Sahlan, K.H. Mohammad Sangidun, S.Ag., Al-Hafidz!" [level=3] [ref=e80]
          - paragraph [ref=e81]: Maktab pengawasan mutu tahfidz, penerbitan amanat ruhiyah (taujiyah) kepada asatidz & santri, serta majelis pengesahan kelulusan Khotmil Qur'an 30 Juz dan sanad qiro'ah.
        - generic: رعاية المعهد
      - generic [ref=e82]:
        - generic [ref=e83]:
          - generic [ref=e84]:
            - generic [ref=e85]: Calon Wisudawan 30 Juz
            - generic [ref=e86]: 1 Santri
            - paragraph [ref=e87]: 1 Siap Diwisuda
          - generic [ref=e88]: 
        - generic [ref=e90]:
          - generic [ref=e91]:
            - generic [ref=e92]: Total Santri Tahfidz
            - generic [ref=e93]: 6 Santri
            - paragraph [ref=e94]: 5 Santri Aktif Mutaba'ah
          - generic [ref=e95]: 
        - generic [ref=e97]:
          - generic [ref=e98]:
            - generic [ref=e99]: Amanat Ruhiyah (Taujiyah)
            - generic [ref=e100]: 4 Nasihat
            - paragraph [ref=e101]: Dipublikasi ke Seluruh Akun
          - generic [ref=e102]: 
        - generic [ref=e104]:
          - generic [ref=e105]:
            - generic [ref=e106]: Rombel & Asatidz Pengampu
            - generic [ref=e107]:
              - text: "4"
              - generic [ref=e108]: Kelas / 4 Halaqah
            - paragraph [ref=e109]: 5 Mata Pelajaran Berjalan
          - generic [ref=e110]: 
      - generic [ref=e112]:
        - generic [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]:
              - heading " Amanat & Taujiyah Pengasuh Terkini" [level=4] [ref=e116]:
                - generic [ref=e117]: 
                - text: Amanat & Taujiyah Pengasuh Terkini
              - button "Kelola Semua (4)" [ref=e118] [cursor=pointer]
            - generic [ref=e119]:
              - generic [ref=e122]:
                - text: Adab & Akhlaq Al-Qur'an
                - heading "Menjaga Keikhlasan Niat dalam Menghafal Kalamullah" [level=5] [ref=e123]
                - paragraph [ref=e124]: "\"Al-Qur'an adalah wahyu yang suci. Setiap ayat yang dihafalkan bukan untuk berbangga diri di hadapan manusia, melainkan sebagai penerang qalbu dan bekal menghadap Allah SWT. Jagalah shalat malam dan adab hamalatil qur'an di setiap nafas kehidupan.\""
                - generic [ref=e125]:
                  - generic [ref=e126]:
                    - generic [ref=e127]: 
                    - text: 2026-10-25
                  - generic [ref=e128]: •
                  - generic [ref=e129]:
                    - generic [ref=e130]: 
                    - text: K.H. Mohammad Sangidun, S.Ag., Al-Hafidz
              - generic [ref=e133]:
                - text: Metode Muroja'ah Mutqin
                - heading "Pentingnya Istiqomah Muroja'ah Harian Tanpa Henti" [level=5] [ref=e134]
                - paragraph [ref=e135]: "\"Nabi SAW berpesan bahwa hafalan Al-Qur'an lebih cepat lepas daripada unta yang terlepas dari ikatannya. Maka jangan pernah biarkan satu hari pun berlalu tanpa melantunkan minimal satu juz hafalan lama.\""
                - generic [ref=e136]:
                  - generic [ref=e137]:
                    - generic [ref=e138]: 
                    - text: 2026-10-15
                  - generic [ref=e139]: •
                  - generic [ref=e140]:
                    - generic [ref=e141]: 
                    - text: K.H. Mohammad Sangidun, S.Ag., Al-Hafidz
          - generic [ref=e142]:
            - button "+ Terbitkan Taujiyah Baru" [ref=e143] [cursor=pointer]:
              - generic [ref=e144]: +
              - text: Terbitkan Taujiyah Baru
            - button "Semua Nasihat" [ref=e145] [cursor=pointer]
        - generic [ref=e146]:
          - generic [ref=e147]:
            - generic [ref=e148]:
              - heading " Calon Khotimin & Otorisasi Wisuda" [level=4] [ref=e149]:
                - generic [ref=e150]: 
                - text: Calon Khotimin & Otorisasi Wisuda
              - button "Buka Panel Wisuda" [ref=e151] [cursor=pointer]
            - generic [ref=e153]:
              - generic [ref=e154]:
                - generic [ref=e155]:
                  - generic [ref=e156]: Fatimatuz Zahra
                  - generic [ref=e157]: 28 / 30 Juz
                - paragraph [ref=e158]: "NIS: 12347 • XII - Tahfidz Ulya • Ustadzah Nurul Hidayah"
                - generic [ref=e159]: "Status: Telah Sah Diwisuda Pengasuh"
              - button " Syahadah" [ref=e160] [cursor=pointer]:
                - generic [ref=e161]: 
                - text: Syahadah
          - button " Masuk ke Majelis Otorisasi Wisuda Sanad 30 Juz" [ref=e162] [cursor=pointer]:
            - generic [ref=e163]: 
            - text: Masuk ke Majelis Otorisasi Wisuda Sanad 30 Juz
      - generic [ref=e164]:
        - generic [ref=e165]:
          - heading " Pengawasan Halaqah & Beban Pembimbingan Asatidz" [level=4] [ref=e166]:
            - generic [ref=e167]: 
            - text: Pengawasan Halaqah & Beban Pembimbingan Asatidz
          - button "Buka Manajemen Halaqah" [ref=e168] [cursor=pointer]
        - generic [ref=e169]:
          - generic [ref=e170]:
            - generic [ref=e171]:
              - generic [ref=e172]: Halaqah Abu Bakar Ash-Shiddiq
              - generic [ref=e173]: 0 Santri
            - paragraph [ref=e174]:
              - text: "Musyrif:"
              - strong [ref=e175]: Ustadz Abdullah Mukhtar, S.Pd.I
            - generic [ref=e176]:
              - generic [ref=e177]: "Akumulasi: 0 Juz"
              - generic [ref=e178]: Aktif Halaqah
          - generic [ref=e179]:
            - generic [ref=e180]:
              - generic [ref=e181]: Halaqah Umar bin Khattab
              - generic [ref=e182]: 1 Santri
            - paragraph [ref=e183]:
              - text: "Musyrif:"
              - strong [ref=e184]: Ustadz Muhammad Yusuf, Lc.
            - generic [ref=e185]:
              - generic [ref=e186]: "Akumulasi: 12 Juz"
              - generic [ref=e187]: Aktif Halaqah
          - generic [ref=e188]:
            - generic [ref=e189]:
              - generic [ref=e190]: Halaqah Utsman bin Affan
              - generic [ref=e191]: 1 Santri
            - paragraph [ref=e192]:
              - text: "Musyrif:"
              - strong [ref=e193]: Ustadz Ahmad Zaki, Al-Hafidz
            - generic [ref=e194]:
              - generic [ref=e195]: "Akumulasi: 3 Juz"
              - generic [ref=e196]: Aktif Halaqah
          - generic [ref=e197]:
            - generic [ref=e198]:
              - generic [ref=e199]: Halaqah Ali bin Abi Thalib
              - generic [ref=e200]: 1 Santri
            - paragraph [ref=e201]:
              - text: "Musyrif:"
              - strong [ref=e202]: Ustadz Ridwan Hakim, M.Pd.
            - generic [ref=e203]:
              - generic [ref=e204]: "Akumulasi: 15 Juz"
              - generic [ref=e205]: Aktif Halaqah
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
  32 |     // Navigasi ke Tab Taujiyah & Mauizhah Hasanah Pengasuh
> 33 |     await page.locator('button').filter({ hasText: 'Taujiyah' }).click();
     |                                                                  ^ Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Taujiyah' }) resolved to 3 elements:
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
  73 |     // Navigasi ke Data Santri
  74 |     await page.locator('button').filter({ hasText: 'Data Santri' }).click();
  75 |     await expect(page.getByText('Muhammad Fauzan Al-Hafidz')).toBeVisible();
  76 | 
  77 |     // Navigasi ke Kelas & Mapel
  78 |     await page.locator('button').filter({ hasText: 'Kelas & Mapel' }).click();
  79 |     await expect(page.getByText('Tahfidz Ula (Tingkat Dasar)')).toBeVisible();
  80 |   });
  81 | 
  82 |   test('E2E 5: Login Santri (Muhammad Fauzan) & Ruang Belajar Hafalan', async ({ page }) => {
  83 |     // Login Cepat sebagai Santri
  84 |     await page.locator('button').filter({ hasText: 'Fauzan' }).click();
  85 | 
  86 |     // Verifikasi Ruang Belajar Santri
  87 |     await expect(page.getByText('Ruang Belajar & Hafalan Pribadi')).toBeVisible();
  88 |     await expect(page.getByText('Peta Progres 30 Juz Saya')).toBeVisible();
  89 |   });
  90 | 
  91 | });
  92 | 
```