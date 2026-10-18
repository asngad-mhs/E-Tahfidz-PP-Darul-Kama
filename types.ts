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