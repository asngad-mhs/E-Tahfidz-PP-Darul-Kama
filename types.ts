export interface User {
    id?: string;
    nama: string;
    role: 'admin' | 'santri' | 'ustadz' | string;
    nis?: string;
    kelas?: string;
    totalJuz?: number;
    halaqah?: string;
    [key: string]: any;
}

export type JuzStatusType = 'Mutqin' | 'Sedang Berjalan' | 'Perlu Muroja\'ah' | 'Belum';

export interface JuzProgressRecord {
    juz: number;
    status: JuzStatusType;
    tanggalUjian?: string;
    nilaiTasmi?: string;
    penguji?: string;
    catatan?: string;
}

export interface JurnalBelajarSantri {
    id: string;
    santriId: string;
    tanggal: string;
    kegiatan: 'Ziyadah Mandiri' | 'Muroja\'ah Mandiri' | 'Talaqqi Simakan' | 'Kajian Tajwid & Makhorij';
    surat: string;
    ayatAwal: number;
    ayatAkhir: number;
    juz: number;
    durasiMenit: number;
    tingkatKelancaran: 'Sangat Lancar' | 'Cukup Lancar' | 'Masih Terbata' | 'Butuh Pendampingan';
    catatanAyatSulit?: string;
    catatanMusyrif?: string;
    parafMusyrif?: string;
    status: 'Selesai' | 'Dalam Proses';
}

export interface RencanaSetoran {
    id: string;
    santriId: string;
    tanggalTarget: string;
    waktu: 'Ba\'da Subuh' | 'Ba\'da Ashar' | 'Ba\'da Maghrib' | 'Ba\'da Isya';
    jenis: 'Ziyadah' | 'Muroja\'ah';
    surat: string;
    ayatAwal: number;
    ayatAkhir: number;
    juz: number;
    status: 'Diajukan' | 'Disetujui Musyrif' | 'Selesai Disetorkan';
    catatanSantri?: string;
    catatanUstadz?: string;
}

export interface Santri {
    id: string;
    nis: string;
    nama: string;
    kelas: string;
    halaqah: string;
    musyrif: string;
    totalHafalanJuz: number;
    suratTerakhir: string;
    status: 'Aktif' | 'Izin' | 'Mutakharij';
    juzProgress?: Record<number, JuzProgressRecord>;
    targetKhatam?: string;
    targetHalamanPerHari?: number;
    lastReadBookmark?: {
        surat: string;
        ayat: number;
        juz: number;
        tanggal: string;
    };
    streakHari?: number;
}

export interface SetoranRecord {
    id: string;
    santriId: string;
    santriNama: string;
    tanggal: string;
    jenis: 'Ziyadah' | 'Muroja\'ah';
    surat: string;
    ayatAwal: number;
    ayatAkhir: number;
    juz: number;
    nilai: 'A (Mumtaz)' | 'B (Jayyid Jiddan)' | 'C (Jayyid)' | 'D (Maqbul)';
    musyrif: string;
    catatan?: string;
}

export interface ApiResponse {
    status: 'success' | 'error';
    message?: string;
    nama?: string;
    role?: string;
    data?: any;
    [key: string]: any;
}

export interface ApiPayload {
    action: string;
    [key: string]: any;
}

export interface LoginCredentials {
    id: string;
    pass: string;
}

export interface KelasTahfidz {
    id: string;
    namaKelas: string;
    tingkat: 'Ula / I\'dad' | 'Wustha' | 'Ulya' | 'Takhassus 30 Juz' | string;
    waliKelas: string;
    ruangan: string;
    kapasitas: number;
    targetJuzMinimal: number;
    tahunAjaran: string;
    keterangan?: string;
    jadwalHalaqah?: string;
}

export interface MataPelajaranTahfidz {
    id: string;
    kodeMapel: string;
    namaMapel: string;
    kitabRujukan: string;
    ustadzPengampu: string;
    kelasId: string;
    namaKelas: string;
    hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jum\'at' | 'Sabtu' | 'Ahad' | string;
    jamMulai: string;
    jamSelesai: string;
    ruangan: string;
    bobotSks?: number;
    deskripsi?: string;
    silabus?: string[];
}