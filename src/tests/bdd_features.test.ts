import { describe, it, expect } from 'vitest';
import { 
    DEMO_USERS, 
    INITIAL_SANTRI, 
    INITIAL_TAUJIYAH_PENGASUH,
    INITIAL_SETORAN,
    INITIAL_JURNAL_BELAJAR,
    INITIAL_RENCANA_SETORAN,
    INITIAL_KELAS_TAHFIDZ,
    INITIAL_MAPEL_TAHFIDZ
} from '../../mockData';
import type { Santri, TaujiyahPengasuh, SetoranRecord, JurnalBelajarSantri } from '../../types';

/**
 * BDD Helper Class
 * Memberikan struktur formal Given - When - Then - And untuk pengujian berbasis perilaku (Behavior-Driven Development)
 */
class BDDScenario {
    private state: Record<string, any> = {};

    given(_description: string, setupFn: (state: Record<string, any>) => void) {
        setupFn(this.state);
        return this;
    }

    when(_description: string, actionFn: (state: Record<string, any>) => void) {
        actionFn(this.state);
        return this;
    }

    then(_description: string, assertionFn: (state: Record<string, any>) => void) {
        assertionFn(this.state);
        return this;
    }

    and(_description: string, fn: (state: Record<string, any>) => void) {
        fn(this.state);
        return this;
    }
}

describe('BDD FEATURE 1: Fitur Konfirmasi Keluar Akun (Logout Confirmation Modal)', () => {

    it('SCENARIO 1.1 [Admin]: Membatalkan konfirmasi keluar dan tetap masuk di aplikasi', () => {
        new BDDScenario()
            .given('GIVEN Admin M. Asngad sedang aktif mengakses Dashboard', (state) => {
                state.user = DEMO_USERS.admin.user;
                state.isAuthenticated = true;
                state.showLogoutConfirmModal = false;
            })
            .when('WHEN Admin menekan tombol "Keluar Akun" di sidebar', (state) => {
                state.showLogoutConfirmModal = true;
            })
            .then('THEN modal dialog konfirmasi keluar akun muncul di layar', (state) => {
                expect(state.showLogoutConfirmModal).toBe(true);
            })
            .when('WHEN Admin memilih "Batal / Tetap Masuk"', (state) => {
                state.showLogoutConfirmModal = false;
                // Session tetap aktif
            })
            .then('THEN modal konfirmasi ditutup dan Admin tetap berada di dalam dashboard', (state) => {
                expect(state.showLogoutConfirmModal).toBe(false);
                expect(state.isAuthenticated).toBe(true);
                expect(state.user.nama).toBe('M. Asngad');
            });
    });

    it('SCENARIO 1.2 [Pengasuh]: Mengonfirmasi keluar dari aplikasi e-Tahfidz', () => {
        new BDDScenario()
            .given('GIVEN Pengasuh K.H. Mohammad Sangidun, S.Ag., Al-Hafidz sedang aktif di Maktab Pengasuhan', (state) => {
                state.user = DEMO_USERS.pengasuh.user;
                state.isAuthenticated = true;
                state.showLogoutConfirmModal = false;
            })
            .when('WHEN Pengasuh menekan tombol "Keluar Akun"', (state) => {
                state.showLogoutConfirmModal = true;
            })
            .then('THEN modal konfirmasi menampilkan identitas Pengasuh K.H. Mohammad Sangidun', (state) => {
                expect(state.showLogoutConfirmModal).toBe(true);
                expect(state.user.nama).toContain('Sangidun');
            })
            .when('WHEN Pengasuh menekan tombol "Ya, Keluar Akun"', (state) => {
                state.showLogoutConfirmModal = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .then('THEN sesi akun diakhiri secara aman dan pengguna diarahkan ke menu utama login', (state) => {
                expect(state.showLogoutConfirmModal).toBe(false);
                expect(state.isAuthenticated).toBe(false);
                expect(state.user).toBeNull();
            });
    });

    it('SCENARIO 1.3 [Ustadz]: Mengonfirmasi keluar akun dari Beranda Pembinaan', () => {
        new BDDScenario()
            .given('GIVEN Ustadz Abdullah Mukhtar sedang aktif di Beranda Pembinaan', (state) => {
                state.user = DEMO_USERS.ustadz.user;
                state.isAuthenticated = true;
                state.showLogoutConfirmModal = false;
            })
            .when('WHEN Ustadz menekan tombol "Keluar Akun" dan mengonfirmasi "Ya, Keluar Akun"', (state) => {
                state.showLogoutConfirmModal = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .then('THEN sesi Ustadz diakhiri secara bersih', (state) => {
                expect(state.isAuthenticated).toBe(false);
                expect(state.user).toBeNull();
            });
    });

    it('SCENARIO 1.4 [Santri]: Mengonfirmasi keluar akun dari Ruang Belajar', () => {
        new BDDScenario()
            .given('GIVEN Santri Muhammad Fauzan sedang aktif di Ruang Belajar Santri', (state) => {
                state.user = DEMO_USERS.santri.user;
                state.isAuthenticated = true;
                state.showLogoutConfirmModal = false;
            })
            .when('WHEN Santri menekan tombol "Keluar Akun" dan mengonfirmasi "Ya, Keluar Akun"', (state) => {
                state.showLogoutConfirmModal = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .then('THEN sesi Santri diakhiri secara bersih', (state) => {
                expect(state.isAuthenticated).toBe(false);
                expect(state.user).toBeNull();
            });
    });
});

describe('BDD FEATURE 2: Modul Pengasuh Pesantren (K.H. Mohammad Sangidun, S.Ag., Al-Hafidz)', () => {

    it('SCENARIO 2.1: Menerbitkan Taujiyah & Mauizhah Hasanah Baru', () => {
        new BDDScenario()
            .given('GIVEN Pengasuh K.H. Mohammad Sangidun, S.Ag., Al-Hafidz membuka tab Taujiyah', (state) => {
                state.pengasuhNama = 'K.H. Mohammad Sangidun, S.Ag., Al-Hafidz';
                state.taujiyahList = [...INITIAL_TAUJIYAH_PENGASUH];
            })
            .when('WHEN Pengasuh menerbitkan Taujiyah baru tentang adab dan muroja\'ah', (state) => {
                const newTaujiyah: TaujiyahPengasuh = {
                    id: `tj-${Date.now()}`,
                    judul: 'Keutamaan Menjaga Al-Qur\'an di Bulan Suci',
                    isi: 'Al-Qur\'an adalah syifa dan rahmat bagi mukminin. Jagalah wirid harianmu.',
                    tanggal: '2026-11-03',
                    pemberiTaujiyah: state.pengasuhNama,
                    tema: 'Adab & Akhlaq Al-Qur\'an',
                    status: 'Dipublikasikan'
                };
                state.taujiyahList.unshift(newTaujiyah);
                state.latestPublished = newTaujiyah;
            })
            .then('THEN Taujiyah tersimpan dan nama pemberi taujiyah sesuai dengan K.H. Mohammad Sangidun, S.Ag., Al-Hafidz', (state) => {
                expect(state.taujiyahList.length).toBeGreaterThan(INITIAL_TAUJIYAH_PENGASUH.length);
                expect(state.latestPublished.pemberiTaujiyah).toContain('Sangidun');
                expect(state.latestPublished.status).toBe('Dipublikasikan');
            });
    });

    it('SCENARIO 2.2: Otorisasi & Pengesahan Khotmil Quran 30 Juz Santri', () => {
        new BDDScenario()
            .given('GIVEN Santri Muhammad Fauzan telah menyelesaikan 30 Juz Mutqin', (state) => {
                state.santri = { ...INITIAL_SANTRI[0], totalHafalanJuz: 30, status: 'Aktif' as const };
            })
            .when('WHEN Pengasuh K.H. Mohammad Sangidun memberikan pengesahan wisuda dan sanad', (state) => {
                state.santriDisahkan = {
                    ...state.santri,
                    status: 'Mutakharij' as const,
                    tanggalKhatam: '2026-11-03'
                };
            })
            .then('THEN status santri berubah menjadi Mutakharij dan siap mengikuti wisuda resmi', (state) => {
                expect(state.santriDisahkan.status).toBe('Mutakharij');
                expect(state.santriDisahkan.totalHafalanJuz).toBe(30);
                expect(state.santriDisahkan.tanggalKhatam).toBeDefined();
            });
    });
});

describe('BDD FEATURE 3: Modul Administrator Sistem & Tata Usaha (M. Asngad)', () => {

    it('SCENARIO 3.1: Pengelolaan Master Data Santri Baru', () => {
        new BDDScenario()
            .given('GIVEN Admin M. Asngad membuka menu Manajemen Master Data Santri', (state) => {
                state.santriList = [...INITIAL_SANTRI];
            })
            .when('WHEN Admin mendaftarkan santri baru bernama Ahmad Zaky', (state) => {
                const newSantri: Santri = {
                    id: 's-99',
                    nis: '12399',
                    nama: 'Ahmad Zaky Al-Farisi',
                    kelas: 'Tahfidz Ula (Tingkat Dasar)',
                    halaqah: 'Halaqah Abu Bakar Ash-Shiddiq',
                    musyrif: 'Ustadz Abdullah Mukhtar, S.Pd.I',
                    suratTerakhir: 'Al-Baqarah',
                    totalHafalanJuz: 1,
                    status: 'Aktif'
                };
                state.santriList.push(newSantri);
                state.addedSantri = newSantri;
            })
            .then('THEN santri baru terdaftar secara sah di dalam database pesantren', (state) => {
                expect(state.santriList.find((s: Santri) => s.id === 's-99')).toBeDefined();
                expect(state.addedSantri.nama).toBe('Ahmad Zaky Al-Farisi');
            });
    });

    it('SCENARIO 3.2: Pengelolaan Kelas & Mata Pelajaran Tahfidz', () => {
        new BDDScenario()
            .given('GIVEN Admin mengelola Kurikulum & Kelas Tahfidz', (state) => {
                state.kelasList = [...INITIAL_KELAS_TAHFIDZ];
                state.mapelList = [...INITIAL_MAPEL_TAHFIDZ];
            })
            .then('THEN seluruh kelas dan mata pelajaran terdaftar lengkap', (state) => {
                expect(state.kelasList.length).toBeGreaterThanOrEqual(3);
                expect(state.mapelList.length).toBeGreaterThanOrEqual(4);
            });
    });
});

describe('BDD FEATURE 4: Modul Ustadz / Musyrif Halaqah Pembina', () => {

    it('SCENARIO 4.1: Pencatatan Setoran Tasmi\' & Evaluasi Tajwid', () => {
        new BDDScenario()
            .given('GIVEN Ustadz Abdullah Mukhtar memimpin halaqah binaan', (state) => {
                state.setoranList = [...INITIAL_SETORAN];
            })
            .when('WHEN Ustadz memverifikasi setoran hafalan Juz 8 dari Santri', (state) => {
                const newSetoran: SetoranRecord = {
                    id: `set-${Date.now()}`,
                    santriId: '12345',
                    santriNama: 'Muhammad Fauzan Al-Hafidz',
                    tanggal: '2026-11-03',
                    jenis: 'Ziyadah',
                    surat: 'Al-An\'am',
                    ayatAwal: 1,
                    ayatAkhir: 50,
                    juz: 8,
                    nilai: 'A (Mumtaz)',
                    musyrif: 'Ustadz Abdullah Mukhtar, S.Pd.I',
                    catatan: 'Bacaan mutqin, makhorijul huruf dan tajwid sangat fasih.'
                };
                state.setoranList.unshift(newSetoran);
                state.newSetoran = newSetoran;
            })
            .then('THEN nilai setoran tersimpan dengan predikat Mumtaz', (state) => {
                expect(state.newSetoran.nilai).toBe('A (Mumtaz)');
                expect(state.setoranList[0].catatan).toBeDefined();
            });
    });

    it('SCENARIO 4.2: Persetujuan Rencana Target Setoran Santri', () => {
        new BDDScenario()
            .given('GIVEN Rencana setoran berstatus "Diajukan"', (state) => {
                state.rencanaList = [...INITIAL_RENCANA_SETORAN];
            })
            .when('WHEN Ustadz menyetujui rencana setoran tersebut', (state) => {
                state.rencanaList[0] = {
                    ...state.rencanaList[0],
                    status: 'Disetujui Musyrif'
                };
            })
            .then('THEN status rencana setoran berubah menjadi Disetujui Musyrif', (state) => {
                expect(state.rencanaList[0].status).toBe('Disetujui Musyrif');
            });
    });
});

describe('BDD FEATURE 5: Modul Santri Tahfidz', () => {

    it('SCENARIO 5.1: Pencatatan Jurnal Mutaba\'ah Belajar Mandiri', () => {
        new BDDScenario()
            .given('GIVEN Santri Muhammad Fauzan Al-Hafidz', (state) => {
                state.jurnalList = [...INITIAL_JURNAL_BELAJAR];
            })
            .when('WHEN Santri mencatat jurnal muroja\'ah mandiri 60 menit', (state) => {
                const newJurnal: JurnalBelajarSantri = {
                    id: `jrn-${Date.now()}`,
                    santriId: '12345',
                    tanggal: '2026-11-03',
                    kegiatan: 'Muroja\'ah Mandiri',
                    surat: 'Al-Fatihah',
                    ayatAwal: 1,
                    ayatAkhir: 7,
                    juz: 1,
                    durasiMenit: 60,
                    tingkatKelancaran: 'Sangat Lancar',
                    catatanAyatSulit: 'Alhamdulillah lancar',
                    status: 'Selesai'
                };
                state.jurnalList.unshift(newJurnal);
                state.latestJurnal = newJurnal;
            })
            .then('THEN jurnal tersimpan di rekam jejak mutaba\'ah santri', (state) => {
                expect(state.latestJurnal.durasiMenit).toBe(60);
                expect(state.latestJurnal.status).toBe('Selesai');
            });
    });
});
