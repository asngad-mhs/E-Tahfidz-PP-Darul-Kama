# 📖 E-Tahfidz Pondok Pesantren Darul Kamal

Sistem Informasi Manajemen Tahfidz Al-Qur'an berbasis Web untuk **Pondok Pesantren Darul Kamal**. Aplikasi ini dirancang untuk mempermudah pencatatan setoran hafalan santri (*Ziyadah* dan *Muroja'ah*), pemantauan progres 30 Juz, penilaian tajwid, serta dapat beroperasi secara **Offline/Lokal** maupun terhubung dengan **Google Sheets** via **Google Apps Script (GAS)**.

---

## 🚀 Fitur Utama

- **Multi-Role User**:
  - 👑 **Administrator**: Pemantauan keseluruhan santri, halaqah, statistik pesantren, dan pengaturan integrasi backend.
  - 📖 **Ustadz / Musyrif**: Input setoran hafalan baru, penilaian tajwid/makhorijul huruf, serta evaluasi catatan santri.
  - 🌟 **Santri**: Akses mandiri untuk melihat riwayat setoran, catatan evaluasi musyrif, dan peta capaian 30 Juz Al-Qur'an.
- **Pencatatan Setoran Lengkap**:
  - Mendukung jenis setoran **Ziyadah** (hafalan baru) dan **Muroja'ah** (pengulangan).
  - Detail surat, rentang ayat, nomor juz, dan predikat nilai (*Mumtaz, Jayyid Jiddan, Jayyid, Maqbul*).
- **Modul Progres 30 Juz Al-Qur'an Interaktif**:
  - Peta matriks 30 Juz lengkap dengan nama Arab (الم, سَيَقُولُ, dll.), nama Latin, dan rentang surat.
  - Status 4 warna per juz: *Mutqin (Lulus Tasmi')*, *Sedang Berjalan (Ziyadah Aktif)*, *Perlu Muroja'ah Ulang*, dan *Belum Dimulai*.
  - Modal interaktif evaluasi tasmi', penguji, tanggal kelulusan, dan catatan ayat mutasyabihat.
  - Tampilan ganda (Grid Kartu 30 Juz & Tabel Rekapitulasi).
  - Cetak Lembar Pantau Mutaba'ah 30 Juz siap cetak/PDF.
- **Fleksibilitas Backend Ganda**:
  - **Mode Demo / Offline**: Berjalan langsung tanpa instalasi server tambahan (menggunakan penyimpanan lokal).
  - **Mode Google Apps Script**: Terhubung langsung ke spreadsheet Google Sheets untuk sinkronisasi data santri secara cloud.

---

## 🔑 Akun Uji Coba Bawaan (Demo)

Anda dapat langsung masuk ke aplikasi menggunakan akun bawaan atau menekan tombol **Masuk Cepat (1-Klik)** di halaman login:

| Peran (Role) | ID Pengguna / NIS | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses penuh dashboard, data santri, & pengaturan API |
| **Santri** | `12345` atau `santri` | `santri123` | Profil santri Muhammad Fauzan Al-Hafidz (7 Juz) |
| **Ustadz / Musyrif** | `ustadz` | `ustadz123` | Pembina Halaqah Abu Bakar Ash-Shiddiq |

---

## 💻 Cara Menjalankan Secara Lokal

### Prasyarat
- **Node.js** (versi 18 ke atas disarankan)
- **npm** atau **bun** / **yarn**

### Langkah Menjalankan:

1. **Clone atau buka repositori:**
   ```bash
   cd e-tahfidz-darul-kamal
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di browser pada alamat `http://localhost:3000` (atau port yang ditentukan Vite).

4. **Build untuk Production:**
   ```bash
   npm run build
   ```

---

## 🔗 Panduan Integrasi Google Apps Script (Google Sheets)

Jika ingin menghubungkan aplikasi ke Google Sheets milik pesantren:

1. Buka [Google Sheets](https://sheets.new) baru, buat sheet bernama `Santri`.
2. Klik menu **Ekstensi** > **Apps Script**.
3. Hapus kode bawaan dan tempelkan kode berikut ke dalam file `Code.gs`:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'login') {
      var id = String(data.id || '').trim();
      var pass = String(data.password || '').trim();

      // Akun Admin Bawaan
      if (id === 'admin' && pass === 'admin123') {
        return createResponse({
          status: 'success',
          nama: 'Administrator Darul Kamal',
          role: 'admin'
        });
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Santri') || ss.getSheets()[0];
      var values = sheet.getDataRange().getValues();

      // Format kolom: [0] ID/NIS, [1] Nama, [2] Kata Sandi, [3] Role
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === id && String(values[i][2]).trim() === pass) {
          return createResponse({
            status: 'success',
            nama: values[i][1],
            role: values[i][3] || 'santri'
          });
        }
      }

      return createResponse({ status: 'error', message: 'ID atau Kata Sandi salah.' });
    }

    return createResponse({ status: 'error', message: 'Aksi tidak dikenali.' });
  } catch (err) {
    return createResponse({ status: 'error', message: err.toString() });
  }
}

function createResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Klik tombol **Deploy** > **New Deployment** (Deployment Baru).
5. Pilih jenis **Web App**.
6. Konfigurasikan:
   - **Execute as**: *Me (email Anda)*
   - **Who has access**: *Anyone (Siapa saja)*
7. Salin URL Web App yang berakhiran `/exec`.
8. Buka menu **Pengaturan & API** di aplikasi E-Tahfidz, tempelkan URL tersebut, lalu simpan.

---

## 📁 Struktur Berkas

```
├── App.tsx                 # Komponen utama & state otentikasi
├── components/
│   ├── Button.tsx          # Komponen tombol dengan loading & icon
│   ├── Dashboard.tsx       # Tampilan dashboard interaktif (Admin, Ustadz, Santri)
│   ├── Input.tsx           # Komponen input form
│   └── LoginScreen.tsx     # Tampilan login dengan opsi demo & konfigurasi GAS
├── constants.ts            # Konstanta URL default & aset pola Islami
├── mockData.ts             # Data bawaan (santri, setoran, akun demo, & template Code.gs)
├── services/
│   └── apiService.ts       # Service komunikasi HTTP POST ke Google Apps Script
├── types.ts                # TypeScript interface data model
└── index.html              # Entry point HTML dengan Tailwind & FontAwesome
```

---

## 🕌 Pondok Pesantren Darul Kamal
*Mencetak Generasi Qur'ani yang Berakhlakul Karimah dan Berwawasan Luas.*
