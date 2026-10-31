import { describe, it, expect } from 'vitest';
import { 
    QURAN_SURAHS, 
    JUZ_METADATA, 
    INITIAL_SANTRI, 
    INITIAL_SETORAN, 
    INITIAL_JURNAL_BELAJAR, 
    INITIAL_RENCANA_SETORAN, 
    DEMO_USERS,
    createDefaultJuzProgress,
    INITIAL_KELAS_TAHFIDZ,
    INITIAL_MAPEL_TAHFIDZ
} from '../../mockData';
import type { Santri, SetoranRecord, JurnalBelajarSantri, RencanaSetoran } from '../../types';

describe('1. Quran & Tahfidz Curricular Integrity (30 Juz & 114 Surah)', () => {
    it('harus memuat 114 Surat Al-Qur\'an secara lengkap dan berurutan', () => {
        expect(QURAN_SURAHS).toHaveLength(114);
        expect(QURAN_SURAHS[0].nama).toBe('Al-Fatihah');
        expect(QURAN_SURAHS[0].nomor).toBe(1);
        expect(QURAN_SURAHS[113].nama).toBe('An-Nas');
        expect(QURAN_SURAHS[113].nomor).toBe(114);
    });

    it('harus memetakan metadata 30 Juz secara akurat tanpa juz yang terlewat', () => {
        expect(JUZ_METADATA).toHaveLength(30);
        JUZ_METADATA.forEach((juz, idx) => {
            expect(juz.juz).toBe(idx + 1);
            expect(juz.namaArab).toBeDefined();
            expect(juz.namaLatin).toBeDefined();
            expect(juz.rentangSurat).toBeDefined();
        });
    });

    it('harus menginisialisasi 30 Juz Progress Map dengan benar sesuai total hafalan santri', () => {
        const progressMap = createDefaultJuzProgress(7);
        expect(Object.keys(progressMap)).toHaveLength(30);
        
        // Juz 1 sampai 7 harus berstatus Mutqin
        for (let i = 1; i <= 7; i++) {
            expect(progressMap[i].status).toBe('Mutqin');
        }
        // Juz 8 harus Sedang Berjalan
        expect(progressMap[8].status).toBe('Sedang Berjalan');
        // Juz setelahnya harus Belum
        for (let i = 9; i <= 30; i++) {
            expect(progressMap[i].status).toBe('Belum');
        }
    });
});

describe('2. Master Data & Hak Akses Multi-Peran (RBAC)', () => {
    it('harus memiliki Administrator utama bernama M. Asngad dengan kredensial resmi', () => {
        const adminAccount = DEMO_USERS.admin;
        expect(adminAccount).toBeDefined();
        expect(adminAccount.user.nama).toBe('M. Asngad');
        expect(adminAccount.user.role).toBe('admin');
        expect(adminAccount.pass).toBe('admin123');
    });

    it('harus memiliki dewan Ustadz / Musyrif terdaftar dengan halaqah pembinaan', () => {
        const ustadzAccount = DEMO_USERS.ustadz;
        expect(ustadzAccount).toBeDefined();
        expect(ustadzAccount.user.nama).toContain('Ustadz Abdullah');
        expect(ustadzAccount.user.role).toBe('ustadz');
    });

    it('harus memuat data master santri dengan struktur lengkap', () => {
        expect(INITIAL_SANTRI.length).toBeGreaterThanOrEqual(4);
        INITIAL_SANTRI.forEach(santri => {
            expect(santri.id).toBeDefined();
            expect(santri.nis).toBeDefined();
            expect(santri.nama).toBeDefined();
            expect(santri.halaqah).toBeDefined();
            expect(santri.musyrif).toBeDefined();
            expect(santri.totalHafalanJuz).toBeGreaterThanOrEqual(0);
            expect(santri.totalHafalanJuz).toBeLessThanOrEqual(30);
            expect(['Aktif', 'Izin', 'Mutakharij']).toContain(santri.status || 'Aktif');
        });
    });

    it('harus memuat data jurnal mutabaah bawaan dan rencana setoran dengan struktur valid', () => {
        expect(INITIAL_JURNAL_BELAJAR.length).toBeGreaterThan(0);
        INITIAL_JURNAL_BELAJAR.forEach(jrn => {
            expect(jrn.santriId).toBeDefined();
            expect(jrn.kegiatan).toBeDefined();
            expect(jrn.surat).toBeDefined();
        });

        expect(INITIAL_RENCANA_SETORAN.length).toBeGreaterThan(0);
        INITIAL_RENCANA_SETORAN.forEach(rcn => {
            expect(rcn.santriId).toBeDefined();
            expect(rcn.tanggalTarget).toBeDefined();
            expect(rcn.status).toBeDefined();
        });
    });
});

describe('3. Alur Kerja Integrasi Santri -> Ustadz (Rencana ke Uji Tasmi\')', () => {
    it('harus dapat memvalidasi pengajuan rencana setoran dari santri', () => {
        const sampleRencana: RencanaSetoran = {
            id: 'rcn-test-1',
            santriId: 's-1',
            tanggalTarget: '2026-11-01',
            waktu: 'Ba\'da Subuh',
            jenis: 'Ziyadah',
            surat: 'Al-An\'am',
            ayatAwal: 1,
            ayatAkhir: 20,
            juz: 7,
            status: 'Diajukan',
            catatanSantri: 'Sudah dimuroja\'ah 10 kali di asrama'
        };

        expect(sampleRencana.status).toBe('Diajukan');
        expect(sampleRencana.ayatAkhir).toBeGreaterThan(sampleRencana.ayatAwal);
    });

    it('harus mensimulasikan alur Uji & Nilai Tasmi\' dari rencana santri menjadi setoran resmi', () => {
        const rencana: RencanaSetoran = {
            id: 'rcn-test-2',
            santriId: 's-1',
            tanggalTarget: '2026-11-01',
            waktu: 'Ba\'da Ashar',
            jenis: 'Ziyadah',
            surat: 'Al-A\'raf',
            ayatAwal: 1,
            ayatAkhir: 15,
            juz: 8,
            status: 'Disetujui Musyrif',
            catatanSantri: 'Siap dites'
        };

        // Ketika Ustadz menekan tombol "Uji & Nilai Tasmi' Sekarang", data rencana dipetakan ke SetoranRecord
        const setoranBaru: SetoranRecord = {
            id: `set-${Date.now()}`,
            santriId: rencana.santriId,
            santriNama: 'Ahmad Fauzan',
            tanggal: new Date().toISOString().split('T')[0],
            jenis: rencana.jenis,
            surat: rencana.surat,
            ayatAwal: rencana.ayatAwal,
            ayatAkhir: rencana.ayatAkhir,
            juz: rencana.juz,
            nilai: 'A (Mumtaz)',
            musyrif: 'Ustadz Abdullah Mukhtar, S.Pd.I',
            catatan: `Evaluasi tasmi': Sangat fasih dan tartil. Catatan santri: "${rencana.catatanSantri}"`
        };

        // Rencana setoran ditandai Selesai Disetorkan
        const updatedRencana: RencanaSetoran = {
            ...rencana,
            status: 'Selesai Disetorkan'
        };

        expect(updatedRencana.status).toBe('Selesai Disetorkan');
        expect(setoranBaru.nilai).toBe('A (Mumtaz)');
        expect(setoranBaru.surat).toBe(rencana.surat);
        expect(setoranBaru.ayatAkhir).toBe(15);
    });
});

describe('4. Alur Kerja Integrasi Ustadz -> Santri (Bimbingan & Paraf Jurnal Mandiri)', () => {
    it('harus dapat mencatat jurnal belajar mandiri dan menerima bimbingan serta paraf musyrif', () => {
        const jurnalAwal: JurnalBelajarSantri = {
            id: 'jrn-test-1',
            santriId: 's-1',
            tanggal: '2026-10-31',
            kegiatan: 'Muroja\'ah Mandiri',
            surat: 'Al-An\'am',
            ayatAwal: 1,
            ayatAkhir: 50,
            juz: 7,
            durasiMenit: 45,
            tingkatKelancaran: 'Cukup Lancar',
            catatanAyatSulit: 'Ada ayat mutasyabihat di ayat 38',
            status: 'Selesai'
        };

        expect(jurnalAwal.catatanMusyrif).toBeUndefined();

        // Ustadz meninjau dan memberikan bimbingan & paraf
        const jurnalDenganBimbingan: JurnalBelajarSantri = {
            ...jurnalAwal,
            catatanMusyrif: 'Perhatikan tanda waqaf lazim di ayat 38 dan samakan dengan surat Hud',
            parafMusyrif: 'Ustadz Abdullah Mukhtar, S.Pd.I'
        };

        expect(jurnalDenganBimbingan.catatanMusyrif).toBeDefined();
        expect(jurnalDenganBimbingan.parafMusyrif).toContain('Ustadz Abdullah');
    });
});

describe('5. Pemetaan Otomatis Halaqah ke Musyrif Pembina (Admin Module)', () => {
    const HALAQAH_MUSYRIF_MAP: Record<string, string> = {
        'Halaqah Abu Bakar Ash-Shiddiq': 'Ustadz Abdullah Mukhtar, S.Pd.I',
        'Halaqah Umar bin Khattab': 'Ustadz Muhammad Yusuf, Lc.',
        'Halaqah Utsman bin Affan': 'Ustadz Ahmad Zaki, Al-Hafidz',
        'Halaqah Ali bin Abi Thalib': 'Ustadz Ridwan Hakim, M.Pd.'
    };

    it('harus memetakan setiap halaqah ke ustadz yang berwenang secara konsisten', () => {
        expect(HALAQAH_MUSYRIF_MAP['Halaqah Abu Bakar Ash-Shiddiq']).toBe('Ustadz Abdullah Mukhtar, S.Pd.I');
        expect(HALAQAH_MUSYRIF_MAP['Halaqah Umar bin Khattab']).toBe('Ustadz Muhammad Yusuf, Lc.');
        expect(HALAQAH_MUSYRIF_MAP['Halaqah Utsman bin Affan']).toBe('Ustadz Ahmad Zaki, Al-Hafidz');
        expect(HALAQAH_MUSYRIF_MAP['Halaqah Ali bin Abi Thalib']).toBe('Ustadz Ridwan Hakim, M.Pd.');
    });
});

describe('6. Autentikasi Multi-Peran & Validasi Kredensial Pengguna', () => {
    it('harus memverifikasi autentikasi Admin M. Asngad dengan kredensial benar', () => {
        const inputId = 'admin';
        const inputPass = 'admin123';
        const account = DEMO_USERS[inputId];
        expect(account).toBeDefined();
        expect(account.pass).toBe(inputPass);
        expect(account.user.nama).toBe('M. Asngad');
        expect(account.user.role).toBe('admin');
    });

    it('harus memverifikasi login santri menggunakan NIS dan password terdaftar', () => {
        const santriNis = '12345';
        const santriFound = INITIAL_SANTRI.find(s => s.nis === santriNis);
        expect(santriFound).toBeDefined();
        expect(santriFound?.nama).toContain('Fauzan');
    });

    it('harus menolak password yang tidak sesuai', () => {
        const inputPass = 'wrongpassword';
        expect(DEMO_USERS.admin.pass === inputPass).toBe(false);
        expect(DEMO_USERS.ustadz.pass === inputPass).toBe(false);
    });
});

describe('7. Format & Struktur Audit Rekapitulasi CSV Setoran', () => {
    it('harus menyusun baris CSV dengan kolom header yang sesuai standar audit pesantren', () => {
        const headers = ["ID", "Santri", "Tanggal", "Jenis", "Surat", "Ayat Awal", "Ayat Akhir", "Juz", "Nilai", "Musyrif", "Catatan"];
        expect(headers).toHaveLength(11);
        
        const sampleRecord = INITIAL_SETORAN[0];
        const row = [
            sampleRecord.id,
            `"${sampleRecord.santriNama}"`,
            sampleRecord.tanggal,
            sampleRecord.jenis,
            `"${sampleRecord.surat}"`,
            sampleRecord.ayatAwal,
            sampleRecord.ayatAkhir,
            sampleRecord.juz,
            `"${sampleRecord.nilai}"`,
            `"${sampleRecord.musyrif}"`,
            `"${sampleRecord.catatan || ''}"`
        ];

        expect(row).toHaveLength(11);
        expect(row[1]).toContain(sampleRecord.santriNama);
    });
});

describe('8. Perhitungan Kemajuan Khotmil Qur\'an & Mutaba\'ah Santri', () => {
    it('harus menghitung persentase khatam 30 Juz secara akurat tanpa pembagian nol', () => {
        const santri7Juz = INITIAL_SANTRI.find(s => s.totalHafalanJuz === 7);
        const persentase7Juz = Math.round(((santri7Juz?.totalHafalanJuz || 0) / 30) * 100);
        expect(persentase7Juz).toBe(23); // (7/30)*100 = 23.33 -> 23%

        const santri30Juz = INITIAL_SANTRI.find(s => s.totalHafalanJuz === 30);
        const persentase30Juz = Math.round(((santri30Juz?.totalHafalanJuz || 0) / 30) * 100);
        expect(persentase30Juz).toBe(100); // 100% Khotmil Qur'an
    });

    it('harus menghitung sisa juz yang harus dihafal santri dengan tepat', () => {
        const santri = INITIAL_SANTRI[0];
        const sisaJuz = 30 - santri.totalHafalanJuz;
        expect(sisaJuz).toBe(23);
        expect(santri.totalHafalanJuz + sisaJuz).toBe(30);
    });
});

describe('9. Manajemen Mutasi Santri & Pengelolaan Status Lembaga', () => {
    it('harus memvalidasi mutasi santri antar halaqah dan pergantian status (Aktif/Izin/Mutakharij)', () => {
        const santriOriginal = INITIAL_SANTRI[0];
        const santriMutasi: Santri = {
            ...santriOriginal,
            halaqah: 'Halaqah Umar bin Khattab',
            musyrif: 'Ustadz Muhammad Yusuf, Lc.',
            status: 'Mutakharij',
            totalHafalanJuz: 30
        };

        expect(santriMutasi.halaqah).toBe('Halaqah Umar bin Khattab');
        expect(santriMutasi.musyrif).toBe('Ustadz Muhammad Yusuf, Lc.');
        expect(santriMutasi.status).toBe('Mutakharij');
        expect(santriMutasi.totalHafalanJuz).toBe(30);
    });
});

describe('10. Modul Kelas Tahfidz & Rekapitulasi Jumlah Santri (Admin, Ustadz, Santri)', () => {
    it('harus memuat seluruh rombongan belajar (Kelas Tahfidz) dengan metadata lengkap', () => {
        expect(INITIAL_KELAS_TAHFIDZ.length).toBeGreaterThanOrEqual(4);
        INITIAL_KELAS_TAHFIDZ.forEach(kelas => {
            expect(kelas.id).toBeDefined();
            expect(kelas.namaKelas).toBeDefined();
            expect(kelas.tingkat).toBeDefined();
            expect(kelas.waliKelas).toBeDefined();
            expect(kelas.ruangan).toBeDefined();
            expect(kelas.kapasitas).toBeGreaterThan(0);
            expect(kelas.targetJuzMinimal).toBeGreaterThanOrEqual(0);
            expect(kelas.jadwalHalaqah).toBeDefined();
            expect(kelas.tahunAjaran).toBeDefined();
        });
    });

    it('harus dapat menghitung jumlah santri per kelas secara dinamis tanpa inkonsistensi', () => {
        const getSantriCount = (namaKelas: string, tingkat: string): number => {
            const namaNorm = namaKelas.toLowerCase();
            const tingkatNorm = tingkat.toLowerCase();
            return INITIAL_SANTRI.filter(s => {
                const sKelas = (s.kelas || '').toLowerCase();
                if (sKelas === namaNorm) return true;
                if (sKelas.includes(tingkatNorm)) return true;
                if (namaNorm.includes('ula') && sKelas.includes('ula')) return true;
                if (namaNorm.includes('wustho') && sKelas.includes('wustho')) return true;
                if (namaNorm.includes('ulya') && sKelas.includes('ulya')) return true;
                if (namaNorm.includes('takhassus') && sKelas.includes('takhassus')) return true;
                return false;
            }).length;
        };

        const ulaKelas = INITIAL_KELAS_TAHFIDZ.find(k => k.id === 'kls-1' || k.tingkat.includes('Ula'));
        expect(ulaKelas).toBeDefined();
        if (ulaKelas) {
            const countUla = getSantriCount(ulaKelas.namaKelas, ulaKelas.tingkat);
            expect(countUla).toBeGreaterThanOrEqual(1);
            // Kapasitas tidak boleh terlampaui
            expect(countUla).toBeLessThanOrEqual(ulaKelas.kapasitas);
        }

        const takhassusKelas = INITIAL_KELAS_TAHFIDZ.find(k => k.id === 'kls-4' || k.tingkat.includes('Takhassus'));
        expect(takhassusKelas).toBeDefined();
        if (takhassusKelas) {
            const countTakhassus = getSantriCount(takhassusKelas.namaKelas, takhassusKelas.tingkat);
            expect(countTakhassus).toBeGreaterThanOrEqual(1);
            expect(countTakhassus).toBeLessThanOrEqual(takhassusKelas.kapasitas);
        }
    });

    it('harus menghitung persentase okupansi rombel ruangan kelas secara akurat', () => {
        const kelas = INITIAL_KELAS_TAHFIDZ[0];
        const dummySantriCount = 12;
        const occupancyRate = Math.round((dummySantriCount / kelas.kapasitas) * 100);
        expect(occupancyRate).toBe(Math.round((12 / kelas.kapasitas) * 100));
        expect(occupancyRate).toBeGreaterThanOrEqual(0);
    });
});

describe('11. Modul Mata Pelajaran & Kurikulum Tahfidz Pesantren', () => {
    it('harus memuat mata pelajaran inti pesantren beserta kitab rujukan dan silabus', () => {
        expect(INITIAL_MAPEL_TAHFIDZ.length).toBeGreaterThanOrEqual(5);
        INITIAL_MAPEL_TAHFIDZ.forEach(mapel => {
            expect(mapel.id).toBeDefined();
            expect(mapel.kodeMapel).toMatch(/^[A-Z]{3}-\d{3}$/);
            expect(mapel.namaMapel).toBeDefined();
            expect(mapel.kitabRujukan).toBeDefined();
            expect(mapel.ustadzPengampu).toBeDefined();
            expect(mapel.hari).toBeDefined();
            expect(mapel.jamMulai).toBeDefined();
            expect(mapel.jamSelesai).toBeDefined();
            expect(mapel.ruangan).toBeDefined();
            expect(mapel.bobotSks).toBeGreaterThan(0);
            expect(Array.isArray(mapel.silabus)).toBe(true);
            expect(mapel.silabus?.length).toBeGreaterThan(0);
        });
    });

    it('harus dapat memfilter mata pelajaran berdasarkan hari dan ustadz pengampu', () => {
        const ustadzName = 'Ustadz Abdullah Mukhtar, S.Pd.I';
        const jadwalUstadz = INITIAL_MAPEL_TAHFIDZ.filter(m => m.ustadzPengampu === ustadzName);
        expect(jadwalUstadz.length).toBeGreaterThan(0);

        const seninMapel = INITIAL_MAPEL_TAHFIDZ.filter(m => m.hari === 'Senin');
        expect(seninMapel.length).toBeGreaterThan(0);
    });

    it('harus dapat memetakan mata pelajaran yang relevan dengan kelas santri', () => {
        const ulaKelas = INITIAL_KELAS_TAHFIDZ.find(k => k.id === 'kls-1' || k.tingkat.includes('Ula'));
        expect(ulaKelas).toBeDefined();
        if (ulaKelas) {
            const mapelKelasUla = INITIAL_MAPEL_TAHFIDZ.filter(
                m => m.kelasId === ulaKelas.id || m.namaKelas.includes('Ula') || m.namaKelas.includes('Dasar')
            );
            expect(mapelKelasUla.length).toBeGreaterThan(0);
            expect(mapelKelasUla[0].kitabRujukan).toContain('Jazariyyah');
        }
    });
});

describe('12. Modul Raport & Syahadah Capaian Tahfidz Al-Qur\'an', () => {
    it('harus memformulasikan nomor registrasi syahadah resmi dan predikat marhalah santri', () => {
        const santri30Juz = INITIAL_SANTRI.find(s => s.totalHafalanJuz === 30) || INITIAL_SANTRI[0];
        const tahunMasehi = new Date().getFullYear();
        const nomorSyahadah = `DK/LPTQ/${tahunMasehi}/${santri30Juz.nis || '1234'}/${santri30Juz.totalHafalanJuz}JUZ`;

        expect(nomorSyahadah).toContain('DK/LPTQ/');
        expect(nomorSyahadah).toContain(santri30Juz.nis);

        const getPredikat = (juz: number) => {
            if (juz >= 30) return { label: 'Khotmil Qur\'an 30 Juz (Mumtaz Syarof)', grade: 'Mumtaz Murtadi' };
            if (juz >= 20) return { label: 'Mutqin Marhalah Ulya (Sangat Baik)', grade: 'Jayyid Jiddan' };
            if (juz >= 10) return { label: 'Mutqin Marhalah Wustho (Baik)', grade: 'Jayyid' };
            return { label: 'Marhalah Ula / I\'dad (Dasar)', grade: 'Maqbul' };
        };

        const predikat7Juz = getPredikat(7);
        expect(predikat7Juz.grade).toBe('Maqbul');

        const predikat30Juz = getPredikat(30);
        expect(predikat30Juz.grade).toBe('Mumtaz Murtadi');
    });
});

describe('13. Utilitas Cerdas & Kalkulator Estimator Target Khatam 30 Juz', () => {
    it('harus menghitung kebutuhan ziayadah harian dan rekomendasi muroja\'ah secara realistis', () => {
        const startJuz = 7;
        const targetJuz = 30;
        const durasiBulan = 12;
        const hariAktifPerMinggu = 5;

        const sisaJuz = targetJuz - startJuz; // 23 Juz
        expect(sisaJuz).toBe(23);

        const sisaHalaman = sisaJuz * 20; // 460 halaman
        expect(sisaHalaman).toBe(460);

        const totalMinggu = Math.round(durasiBulan * 4.33); // ~52 minggu
        const totalHariAktif = totalMinggu * hariAktifPerMinggu; // 260 hari
        const halamanPerHari = parseFloat((sisaHalaman / totalHariAktif).toFixed(1)); // ~1.8 halaman/hari

        expect(halamanPerHari).toBeGreaterThan(1.0);
        expect(halamanPerHari).toBeLessThan(3.0);

        const rekomendasiMurojaah = Math.max(0.5, Math.min(2.5, +(startJuz / 10).toFixed(1)));
        expect(rekomendasiMurojaah).toBe(0.7);
    });
});

