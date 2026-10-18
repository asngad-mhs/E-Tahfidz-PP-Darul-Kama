import { Santri, SetoranRecord, User } from './types';

export const DEMO_USERS: Record<string, { pass: string; user: User }> = {
    admin: {
        pass: 'admin123',
        user: {
            id: 'admin',
            nama: 'KH. Ahmad Ridwan, Lc.',
            role: 'admin',
            kelas: 'Pimpinan & Koordinator Tahfidz'
        }
    },
    santri: {
        pass: 'santri123',
        user: {
            id: '12345',
            nis: '12345',
            nama: 'Muhammad Fauzan Al-Hafidz',
            role: 'santri',
            kelas: 'Kelas XI - Tahfidz Ula A',
            halaqah: 'Halaqah Abu Bakar Ash-Shiddiq',
            totalJuz: 7
        }
    },
    '12345': {
        pass: 'santri123',
        user: {
            id: '12345',
            nis: '12345',
            nama: 'Muhammad Fauzan Al-Hafidz',
            role: 'santri',
            kelas: 'Kelas XI - Tahfidz Ula A',
            halaqah: 'Halaqah Abu Bakar Ash-Shiddiq',
            totalJuz: 7
        }
    },
    ustadz: {
        pass: 'ustadz123',
        user: {
            id: 'ustadz',
            nama: 'Ustadz Abdullah Mukhtar, S.Pd.I',
            role: 'ustadz',
            halaqah: 'Pembina Halaqah Abu Bakar Ash-Shiddiq'
        }
    }
};

export const INITIAL_SANTRI: Santri[] = [
    {
        id: 's-1',
        nis: '12345',
        nama: 'Muhammad Fauzan Al-Hafidz',
        kelas: 'XI IPA - Tahfidz Ula',
        halaqah: 'Halaqah Abu Bakar',
        musyrif: 'Ustadz Abdullah',
        totalHafalanJuz: 7,
        suratTerakhir: "Al-A'raf : 1 - 50",
        status: 'Aktif'
    },
    {
        id: 's-2',
        nis: '12346',
        nama: 'Ahmad Ziyad Rahman',
        kelas: 'X - Tahfidz Wustho',
        halaqah: 'Halaqah Umar bin Khattab',
        musyrif: 'Ustadz Hasan Basri',
        totalHafalanJuz: 12,
        suratTerakhir: 'Yusuf : 1 - 65',
        status: 'Aktif'
    },
    {
        id: 's-3',
        nis: '12347',
        nama: 'Fatimatuz Zahra',
        kelas: 'XII - Tahfidz Ulya',
        halaqah: 'Halaqah Khadijah',
        musyrif: 'Ustadzah Nurul Hidayah',
        totalHafalanJuz: 28,
        suratTerakhir: 'Al-Hasyr : 1 - 24',
        status: 'Aktif'
    },
    {
        id: 's-4',
        nis: '12348',
        nama: 'Rizki Maulana Malik',
        kelas: 'IX - Tahfidz Dasar',
        halaqah: 'Halaqah Utsman bin Affan',
        musyrif: 'Ustadz Abdullah',
        totalHafalanJuz: 3,
        suratTerakhir: "An-Naba' s.d An-Nas",
        status: 'Aktif'
    },
    {
        id: 's-5',
        nis: '12349',
        nama: 'Hilman Syakir',
        kelas: 'XI - Tahfidz Ula',
        halaqah: 'Halaqah Ali bin Abi Thalib',
        musyrif: 'Ustadz M. Ilyas',
        totalHafalanJuz: 15,
        suratTerakhir: 'Al-Kahfi : 1 - 110',
        status: 'Aktif'
    },
    {
        id: 's-6',
        nis: '12350',
        nama: 'Aisyah Putri Rahmadhani',
        kelas: 'XI - Tahfidz Ula',
        halaqah: 'Halaqah Aisyah',
        musyrif: 'Ustadzah Siti Maryam',
        totalHafalanJuz: 9,
        suratTerakhir: 'At-Taubah : 1 - 40',
        status: 'Aktif'
    }
];

export const INITIAL_SETORAN: SetoranRecord[] = [
    {
        id: 'set-1',
        santriId: 's-1',
        santriNama: 'Muhammad Fauzan Al-Hafidz',
        tanggal: '2026-10-17',
        jenis: 'Ziyadah',
        surat: "Al-A'raf",
        ayatAwal: 1,
        ayatAkhir: 25,
        juz: 8,
        nilai: 'A (Mumtaz)',
        musyrif: 'Ustadz Abdullah',
        catatan: 'Makharijul huruf sangat fasih, pertahankan mad thabi\'i'
    },
    {
        id: 'set-2',
        santriId: 's-1',
        santriNama: 'Muhammad Fauzan Al-Hafidz',
        tanggal: '2026-10-16',
        jenis: "Muroja'ah",
        surat: "Al-An'am",
        ayatAwal: 120,
        ayatAkhir: 165,
        juz: 8,
        nilai: 'B (Jayyid Jiddan)',
        musyrif: 'Ustadz Abdullah',
        catatan: 'Lancar, perhatikan ghunnah pada nun tasydid'
    },
    {
        id: 'set-3',
        santriId: 's-2',
        santriNama: 'Ahmad Ziyad Rahman',
        tanggal: '2026-10-17',
        jenis: 'Ziyadah',
        surat: 'Yusuf',
        ayatAwal: 40,
        ayatAkhir: 65,
        juz: 12,
        nilai: 'A (Mumtaz)',
        musyrif: 'Ustadz Hasan Basri',
        catatan: 'Sempurna dan tartil'
    },
    {
        id: 'set-4',
        santriId: 's-3',
        santriNama: 'Fatimatuz Zahra',
        tanggal: '2026-10-17',
        jenis: "Muroja'ah",
        surat: 'Al-Mujadilah & Al-Hasyr',
        ayatAwal: 1,
        ayatAkhir: 24,
        juz: 28,
        nilai: 'A (Mumtaz)',
        musyrif: 'Ustadzah Nurul Hidayah',
        catatan: 'Siap untuk tasmi\' 5 juz pekan depan'
    },
    {
        id: 'set-5',
        santriId: 's-4',
        santriNama: 'Rizki Maulana Malik',
        tanggal: '2026-10-16',
        jenis: 'Ziyadah',
        surat: 'An-Nazi\'at',
        ayatAwal: 1,
        ayatAkhir: 46,
        juz: 30,
        nilai: 'B (Jayyid Jiddan)',
        musyrif: 'Ustadz Abdullah',
        catatan: 'Tingkatkan pengucapan huruf kha dan '
    }
];

export const GOOGLE_SCRIPT_SAMPLE_CODE = `// ==========================================
// KODE BACKEND GOOGLE APPS SCRIPT (Code.gs)
// Pondok Pesantren Darul Kamal
// ==========================================

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;

    // 1. Aksi LOGIN
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

      // Atau baca dari Sheet 'Santri'
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Santri') || ss.getSheets()[0];
      var values = sheet.getDataRange().getValues();

      // Kolom diasumsikan: [0] NIS/ID, [1] Nama, [2] Password, [3] Role
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
`;
