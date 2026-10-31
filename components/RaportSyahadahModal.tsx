import React, { useRef } from 'react';
import { Santri, SetoranRecord, KelasTahfidz } from '../types';
import { JUZ_METADATA } from '../mockData';

interface RaportSyahadahModalProps {
    isOpen: boolean;
    onClose: () => void;
    santri: Santri | null;
    setoranList: SetoranRecord[];
    kelasList?: KelasTahfidz[];
}

export const RaportSyahadahModal: React.FC<RaportSyahadahModalProps> = ({
    isOpen,
    onClose,
    santri,
    setoranList,
    kelasList = []
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !santri) return null;

    // Filter setoran santri
    const riwayatSantri = setoranList.filter(s => s.santriId === santri.id || s.santriNama === santri.nama);

    // Cari kelas terkait
    const kelasInfo = kelasList.find(k => 
        k.namaKelas.toLowerCase() === (santri.kelas || '').toLowerCase() ||
        k.tingkat.toLowerCase() === (santri.kelas || '').toLowerCase() ||
        (santri.kelas || '').toLowerCase().includes(k.tingkat.toLowerCase())
    );

    // Hitung statistik
    const totalJuz = santri.totalHafalanJuz || 0;
    const persentase = Math.round((totalJuz / 30) * 100);
    const mutqinCount = Object.values(santri.juzProgress || {}).filter(j => j.status === 'Mutqin').length || totalJuz;

    // Nomor Registrasi Syahadah Resmi
    const tahunHijri = '1448 H';
    const tahunMasehi = new Date().getFullYear();
    const nomorSyahadah = `DK/LPTQ/${tahunMasehi}/${santri.nis || '1234'}/${totalJuz}JUZ`;

    // Predikat kelulusan
    const getPredikat = (juz: number) => {
        if (juz >= 30) return { label: 'Khotmil Qur\'an 30 Juz (Mumtaz Syarof)', grade: 'Mumtaz Murtadi', color: 'emerald' };
        if (juz >= 20) return { label: 'Mutqin Marhalah Ulya (Sangat Baik)', grade: 'Jayyid Jiddan', color: 'blue' };
        if (juz >= 10) return { label: 'Mutqin Marhalah Wustho (Baik)', grade: 'Jayyid', color: 'amber' };
        return { label: 'Marhalah Ula / I\'dad (Dasar)', grade: 'Maqbul', color: 'slate' };
    };

    const predikatInfo = getPredikat(totalJuz);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white border border-gray-200 shadow-2xl rounded-none my-6 text-gray-800">
                {/* Header Kontrol (Hanya di layar, disembunyikan saat cetak) */}
                <div className="no-print bg-emerald-900 text-white px-5 py-3 flex items-center justify-between border-b border-emerald-800">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-certificate text-amber-400"></i>
                        <span className="font-semibold text-sm tracking-wide">
                            Transkrip & Syahadah Capaian Tahfidz Al-Qur'an
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold text-xs transition shadow"
                        >
                            <i className="fa-solid fa-print"></i>
                            <span>Cetak Dokumen Resmi (PDF)</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-emerald-200 hover:text-white transition"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* AREA CETAK RESMI (KERTAS A4 PERSPEKTIF PESANTREN) */}
                <div ref={printRef} className="p-6 sm:p-10 bg-white font-sans text-gray-900 print:p-0">
                    {/* Border Dekoratif Islami Luar */}
                    <div className="border-4 border-double border-emerald-850 p-6 sm:p-8 relative">
                        {/* Sudut Dekoratif */}
                        <div className="absolute top-1 left-1 text-emerald-800 text-xs font-serif opacity-60">❖</div>
                        <div className="absolute top-1 right-1 text-emerald-800 text-xs font-serif opacity-60">❖</div>
                        <div className="absolute bottom-1 left-1 text-emerald-800 text-xs font-serif opacity-60">❖</div>
                        <div className="absolute bottom-1 right-1 text-emerald-800 text-xs font-serif opacity-60">❖</div>

                        {/* KOP RESMI PESANTREN */}
                        <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4 mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-850 text-white flex flex-col items-center justify-center border border-amber-500 shadow-sm shrink-0">
                                <span className="font-arab text-2xl text-amber-300">كمال</span>
                                <span className="text-[9px] font-mono tracking-tighter uppercase font-bold">DK-TAHFIDZ</span>
                            </div>
                            
                            <div className="text-center flex-1 px-4">
                                <div className="font-arab text-2xl sm:text-3xl text-emerald-900 font-bold tracking-wide">
                                    معهد دار الكمال لتحفيظ القرآن الكريم
                                </div>
                                <h1 className="text-base sm:text-xl font-bold uppercase tracking-wider text-emerald-950 mt-0.5">
                                    Pondok Pesantren Darul Kamal
                                </h1>
                                <p className="text-xs sm:text-sm font-semibold text-emerald-800 uppercase tracking-widest">
                                    Lembaga Pengembangan Tahfidzul Qur'an (LPTQ)
                                </p>
                                <p className="text-[11px] text-gray-600 mt-1">
                                    Kompleks Pondok Pesantren Darul Kamal, Cilacap, Jawa Tengah | e-Tahfidz Cloud System
                                </p>
                            </div>

                            <div className="w-16 h-16 sm:w-20 sm:h-20 border border-gray-300 p-1 bg-gray-50 flex flex-col items-center justify-center shrink-0 text-center">
                                <i className="fa-solid fa-qrcode text-3xl text-emerald-900"></i>
                                <span className="text-[8px] text-gray-500 mt-1 font-mono">VERIFIED</span>
                            </div>
                        </div>

                        {/* JUDUL DOKUMEN */}
                        <div className="text-center mb-6">
                            <span className="font-arab text-xl text-emerald-800 block mb-1">
                                شهادة وتفاصيل حفظ القرآن الكريم
                            </span>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-widest inline-block border-b-2 border-amber-500 pb-1">
                                Transkrip Hasil Mutaba'ah & Ujian Tasmi' Tahfidz
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                No. Registrasi: {nomorSyahadah}
                            </p>
                        </div>

                        {/* BIODATA SANTRI */}
                        <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm">
                            <div className="flex">
                                <span className="w-36 text-gray-600 font-medium">Nama Lengkap Santri</span>
                                <span className="font-bold text-gray-900">: {santri.nama}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600 font-medium">Nomor Induk (NIS)</span>
                                <span className="font-mono font-bold text-emerald-900">: {santri.nis}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600 font-medium">Kelas / Rombel</span>
                                <span className="font-semibold text-gray-800">: {santri.kelas || kelasInfo?.namaKelas || 'Tahfidz Ula'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600 font-medium">Halaqah Binaan</span>
                                <span className="font-semibold text-gray-800">: {santri.halaqah}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600 font-medium">Ustadz Musyrif</span>
                                <span className="font-semibold text-gray-800">: {santri.musyrif}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600 font-medium">Tahun Akademik</span>
                                <span className="font-medium text-gray-700">: {tahunHijri} / {tahunMasehi}</span>
                            </div>
                        </div>

                        {/* RINGKASAN CAPAIAN EKSEKUTIF */}
                        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                            <div className="border border-emerald-200 bg-white p-3">
                                <span className="text-[11px] text-gray-500 block uppercase font-medium">Total Capaian Mutqin</span>
                                <span className="text-xl sm:text-2xl font-bold text-emerald-900 font-serif">
                                    {mutqinCount} <span className="text-xs font-sans text-gray-600">/ 30 Juz</span>
                                </span>
                                <span className="text-[10px] text-emerald-700 block font-semibold mt-0.5">
                                    ({persentase}% Khatam Al-Qur'an)
                                </span>
                            </div>
                            <div className="border border-emerald-200 bg-white p-3">
                                <span className="text-[11px] text-gray-500 block uppercase font-medium">Predikat Marhalah</span>
                                <span className="text-xs sm:text-sm font-bold text-gray-900 block mt-1">
                                    {predikatInfo.grade}
                                </span>
                                <span className="text-[10px] text-gray-600 block">
                                    {predikatInfo.label}
                                </span>
                            </div>
                            <div className="border border-emerald-200 bg-white p-3">
                                <span className="text-[11px] text-gray-500 block uppercase font-medium">Frekuensi Tasmi' Resmi</span>
                                <span className="text-xl sm:text-2xl font-bold text-gray-900 font-serif">
                                    {riwayatSantri.length} <span className="text-xs font-sans text-gray-600">Sesi</span>
                                </span>
                                <span className="text-[10px] text-gray-600 block mt-0.5">
                                    Tercatat di Mutaba'ah
                                </span>
                            </div>
                        </div>

                        {/* TABEL RINCIAN CAPAIAN 30 JUZ AL-QUR'AN */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center justify-between border-b border-gray-200 pb-1">
                                <span>I. Matriks Capaian Mutaba'ah 30 Juz Al-Qur'an</span>
                                <span className="text-[10px] font-normal text-gray-500 lowercase">status kelulusan per juz</span>
                            </h3>

                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                                {Array.from({ length: 30 }, (_, i) => i + 1).map(juzNum => {
                                    const meta = JUZ_METADATA[juzNum - 1];
                                    const record = santri.juzProgress?.[juzNum];
                                    const isMutqin = record?.status === 'Mutqin' || juzNum <= totalJuz;
                                    const isWalking = record?.status === 'Sedang Berjalan' || juzNum === totalJuz + 1;

                                    return (
                                        <div 
                                            key={juzNum}
                                            className={`p-1.5 border ${
                                                isMutqin
                                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                                    : isWalking
                                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                                            }`}
                                        >
                                            <div className="font-bold flex items-center justify-between px-0.5">
                                                <span>Juz {juzNum}</span>
                                                {isMutqin && <i className="fa-solid fa-check text-[9px] text-emerald-700"></i>}
                                            </div>
                                            <div className="font-arab text-xs mt-0.5 truncate">{meta?.namaArab}</div>
                                            <div className="text-[8px] font-medium tracking-tight mt-0.5">
                                                {isMutqin ? 'MUTQIN' : isWalking ? 'PROSES' : 'BELUM'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIWAYAT TASMI' TERAKHIR */}
                        {riwayatSantri.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 border-b border-gray-200 pb-1">
                                    II. Riwayat Ujian Tasmi' Resmi Terakhir
                                </h3>
                                <table className="w-full text-left border-collapse text-[11px]">
                                    <thead>
                                        <tr className="bg-gray-100 border-y border-gray-300 text-gray-700">
                                            <th className="py-1 px-2 font-semibold">Tanggal</th>
                                            <th className="py-1 px-2 font-semibold">Jenis</th>
                                            <th className="py-1 px-2 font-semibold">Surat & Rentang Ayat</th>
                                            <th className="py-1 px-2 font-semibold">Juz</th>
                                            <th className="py-1 px-2 font-semibold">Nilai</th>
                                            <th className="py-1 px-2 font-semibold">Penguji</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {riwayatSantri.slice(0, 4).map((r, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="py-1 px-2 font-mono text-gray-600">{r.tanggal}</td>
                                                <td className="py-1 px-2 font-medium">{r.jenis}</td>
                                                <td className="py-1 px-2">{r.surat} : {r.ayatAwal}-{r.ayatAkhir}</td>
                                                <td className="py-1 px-2 font-semibold">Juz {r.juz}</td>
                                                <td className="py-1 px-2">
                                                    <span className="font-bold text-emerald-800">{r.nilai}</span>
                                                </td>
                                                <td className="py-1 px-2 text-gray-700">{r.musyrif}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAUJIYAH & CATATAN DEWAN ASATIDZ */}
                        <div className="border border-emerald-200 bg-emerald-50/40 p-3 mb-6 text-xs text-gray-700">
                            <span className="font-bold text-emerald-900 block mb-1">
                                Taujiyah & Amanat Pengasuh:
                            </span>
                            <p className="italic leading-relaxed">
                                "Al-Qur'an adalah kalamullah yang suci. Menghafalnya adalah anugerah kemuliaan, dan memutqinkannya 
                                sepanjang hayat adalah wujud ketaatan yang sejati. Teruslah istiqomah dalam muroja'ah harian, 
                                menjaga adab ahlul qur'an, serta mengamalkannya dalam akhlaq keseharian."
                            </p>
                        </div>

                        {/* LEGALITAS & TANDA TANGAN */}
                        <div className="pt-4 border-t border-gray-300 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center text-xs">
                            <div>
                                <span className="text-gray-500 block mb-1">Mengetahui,</span>
                                <span className="font-semibold text-gray-800 block">Wali Kelas / Musyrif</span>
                                <div className="h-14 sm:h-16 flex items-center justify-center">
                                    <span className="font-arab text-sm text-emerald-900 opacity-70">المشرف</span>
                                </div>
                                <span className="font-bold text-gray-900 underline block">{santri.musyrif}</span>
                                <span className="text-[10px] text-gray-500 font-mono">NIP. 19850412.001</span>
                            </div>

                            <div className="hidden sm:block">
                                <span className="text-gray-500 block mb-1">Diverifikasi & Diberikan di:</span>
                                <span className="font-semibold text-gray-800 block">Cilacap, Jawa Tengah</span>
                                <div className="h-14 sm:h-16 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full border border-dashed border-emerald-600 flex items-center justify-center text-[9px] text-emerald-800 font-bold uppercase rotate-[-12deg]">
                                        CAP RESMI LPTQ
                                    </div>
                                </div>
                                <span className="text-gray-700 block">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span className="text-[10px] text-emerald-800 font-semibold">{tahunHijri}</span>
                            </div>

                            <div>
                                <span className="text-gray-500 block mb-1">Menyetujui & Mengesahkan,</span>
                                <span className="font-semibold text-gray-800 block">Administrator / Pengasuh</span>
                                <div className="h-14 sm:h-16 flex items-center justify-center">
                                    <span className="font-arab text-sm text-emerald-900 opacity-70">إدارة المعهد</span>
                                </div>
                                <span className="font-bold text-gray-900 underline block">M. Asngad</span>
                                <span className="text-[10px] text-gray-500 font-mono">Koordinator Tahfidz Darul Kamal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Modal Kontrol Layar */}
                <div className="no-print bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        *Dokumen ini sah dicetak sebagai laporan capaian tahfidz berkala santri kepada wali santri.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
