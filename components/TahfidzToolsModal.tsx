import React, { useState } from 'react';
import { Santri, SetoranRecord, JurnalBelajarSantri, RencanaSetoran, KelasTahfidz, MataPelajaranTahfidz } from '../types';
import { QURAN_SURAHS } from '../mockData';

interface TahfidzToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'kalkulator' | 'audio' | 'backup';
    currentSantri?: Santri;
    allSantri: Santri[];
    allSetoran: SetoranRecord[];
    allJurnal: JurnalBelajarSantri[];
    allRencana: RencanaSetoran[];
    allKelas: KelasTahfidz[];
    allMapel: MataPelajaranTahfidz[];
    onRestoreData: (backupData: {
        santri?: Santri[];
        setoran?: SetoranRecord[];
        jurnal?: JurnalBelajarSantri[];
        rencana?: RencanaSetoran[];
        kelas?: KelasTahfidz[];
        mapel?: MataPelajaranTahfidz[];
    }) => void;
}

export const TahfidzToolsModal: React.FC<TahfidzToolsModalProps> = ({
    isOpen,
    onClose,
    initialTab = 'kalkulator',
    currentSantri,
    allSantri,
    allSetoran,
    allJurnal,
    allRencana,
    allKelas,
    allMapel,
    onRestoreData
}) => {
    const [activeTab, setActiveTab] = useState<'kalkulator' | 'audio' | 'backup'>(initialTab);

    // KALKULATOR STATE
    const [targetSantriId, setTargetSantriId] = useState<string>(currentSantri?.id || allSantri[0]?.id || 's-1');
    const selectedSantri = allSantri.find(s => s.id === targetSantriId) || currentSantri || allSantri[0];
    const [startJuz, setStartJuz] = useState<number>(selectedSantri?.totalHafalanJuz || 0);
    const [targetJuz, setTargetJuz] = useState<number>(30);
    const [durasiBulan, setDurasiBulan] = useState<number>(12);
    const [hariAktifPerMinggu, setHariAktifPerMinggu] = useState<number>(5);

    // Hitung estimasi
    const sisaJuz = Math.max(0, targetJuz - startJuz);
    const sisaHalaman = sisaJuz * 20; // 1 juz standar Mushaf Madinah = 20 halaman
    const totalMinggu = Math.max(1, Math.round(durasiBulan * 4.33));
    const totalHariAktif = totalMinggu * hariAktifPerMinggu;
    const halamanPerHari = totalHariAktif > 0 ? (sisaHalaman / totalHariAktif).toFixed(1) : '0';
    const lembarPerHari = (parseFloat(halamanPerHari) / 2).toFixed(1);
    const rekomendasiMurojaah = Math.max(0.5, Math.min(2.5, +(startJuz / 10).toFixed(1)));

    // Tanggal Estimasi Khatam
    const tanggalEstimasiKhatam = new Date();
    tanggalEstimasiKhatam.setMonth(tanggalEstimasiKhatam.getMonth() + durasiBulan);
    const tanggalEstimasiFormat = tanggalEstimasiKhatam.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // AUDIO MURATTAL STATE
    const [selectedSurahNomor, setSelectedSurahNomor] = useState<number>(1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playbackRate, setPlaybackRate] = useState<number>(1.0);
    const [audioError, setAudioError] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const selectedSurah = QURAN_SURAHS.find(s => s.nomor === selectedSurahNomor) || QURAN_SURAHS[0];
    const surahPadded = String(selectedSurah.nomor).padStart(3, '0');
    // CDN audio terpercaya Mishary Rashid Alafasy
    const audioSource = `https://server8.mp3quran.net/afs/${surahPadded}.mp3`;

    const handlePlayAudio = () => {
        if (!audioRef.current) return;
        setAudioError(null);
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
                console.error("Audio playback error:", err);
                setAudioError("Audio sedang disiapkan. Periksa koneksi internet untuk memutar murattal.");
                setIsPlaying(false);
            });
    };

    const handlePauseAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        setIsPlaying(false);
    };

    const handleChangePlaybackRate = (rate: number) => {
        setPlaybackRate(rate);
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    };

    // BACKUP & RESTORE STATE
    const [backupStatus, setBackupStatus] = useState<string | null>(null);
    const [restoreError, setRestoreError] = useState<string | null>(null);

    const handleDownloadBackup = () => {
        const fullBackup = {
            app: 'E-Tahfidz PP Darul Kamal',
            pesantren: 'Pondok Pesantren Darul Kamal',
            administrator: 'M. Asngad',
            timestamp: new Date().toISOString(),
            data: {
                santri: allSantri,
                setoran: allSetoran,
                jurnal: allJurnal,
                rencana: allRencana,
                kelas: allKelas,
                mapel: allMapel
            }
        };

        const jsonStr = JSON.stringify(fullBackup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `backup_etahfidz_darulkamal_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setBackupStatus("Cadangan data JSON berhasil dibuat dan diunduh ke perangkat Anda.");
    };

    const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                const data = parsed.data || parsed;
                if (!data || (!data.santri && !data.setoran && !data.kelas)) {
                    throw new Error("Format cadangan tidak dikenali.");
                }
                onRestoreData(data);
                setBackupStatus("Data berhasil dipulihkan dari berkas cadangan!");
                setRestoreError(null);
            } catch (err: any) {
                setRestoreError("Gagal membaca berkas cadangan. Pastikan file berformat JSON valid dari sistem ini.");
            }
        };
        reader.readAsText(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white border border-gray-200 shadow-2xl rounded-none my-6 text-gray-800">
                {/* Header */}
                <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-800">
                    <div className="flex items-center gap-2.5">
                        <i className="fa-solid fa-toolbox text-amber-400 text-lg"></i>
                        <div>
                            <h2 className="font-bold text-sm tracking-wide">
                                Perangkat Cerdas & Utilitas E-Tahfidz
                            </h2>
                            <p className="text-[11px] text-emerald-200">
                                Pondok Pesantren Darul Kamal — Fitur Penunjang Kesiapan Produksi
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-emerald-200 hover:text-white transition"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Sub-Navigasi Tab */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-5 pt-2 gap-2 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('kalkulator')}
                        className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
                            activeTab === 'kalkulator'
                                ? 'border-emerald-700 text-emerald-900 bg-white border-t border-x border-b-white rounded-t'
                                : 'border-transparent text-gray-600 hover:text-emerald-800'
                        }`}
                    >
                        <i className="fa-solid fa-calculator text-emerald-700"></i>
                        <span>Estimator Target Khatam</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('audio')}
                        className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
                            activeTab === 'audio'
                                ? 'border-emerald-700 text-emerald-900 bg-white border-t border-x border-b-white rounded-t'
                                : 'border-transparent text-gray-600 hover:text-emerald-800'
                        }`}
                    >
                        <i className="fa-solid fa-headphones text-emerald-700"></i>
                        <span>Murattal & Muroja'ah Audio</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('backup')}
                        className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
                            activeTab === 'backup'
                                ? 'border-emerald-700 text-emerald-900 bg-white border-t border-x border-b-white rounded-t'
                                : 'border-transparent text-gray-600 hover:text-emerald-800'
                        }`}
                    >
                        <i className="fa-solid fa-database text-emerald-700"></i>
                        <span>Cadangan Data Pesantren</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
                    {/* TAB 1: KALKULATOR TARGET KHATAM */}
                    {activeTab === 'kalkulator' && (
                        <div className="space-y-5">
                            <div className="bg-emerald-50 border border-emerald-200 p-4">
                                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                    <i className="fa-solid fa-bullseye text-emerald-700"></i>
                                    <span>Simulasi & Estimasi Rencana Khatam Al-Qur'an 30 Juz</span>
                                </h3>
                                <p className="text-xs text-emerald-800 mt-1">
                                    Hitung ritme setoran ziyadah harian dan jadwal muroja'ah yang realistis agar hafalan 
                                    selesai tepat waktu dengan mutu yang mutqin.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Pilih Santri Target:
                                    </label>
                                    <select
                                        value={targetSantriId}
                                        onChange={(e) => {
                                            setTargetSantriId(e.target.value);
                                            const s = allSantri.find(st => st.id === e.target.value);
                                            if (s) setStartJuz(s.totalHafalanJuz || 0);
                                        }}
                                        className="w-full text-xs border border-gray-300 p-2 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        {allSantri.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.nama} ({s.totalHafalanJuz} Juz Mutqin) - {s.kelas || 'Tahfidz'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Target Pencapaian Akhir:
                                    </label>
                                    <select
                                        value={targetJuz}
                                        onChange={(e) => setTargetJuz(Number(e.target.value))}
                                        className="w-full text-xs border border-gray-300 p-2 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value={5}>5 Juz (Marhalah I'dad)</option>
                                        <option value={10}>10 Juz (Marhalah Ula)</option>
                                        <option value={15}>15 Juz (Marhalah Wustho)</option>
                                        <option value={20}>20 Juz (Marhalah Wustho Lanjut)</option>
                                        <option value={25}>25 Juz (Marhalah Ulya)</option>
                                        <option value={30}>30 Juz (Khotmil Qur'an Akbar)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Batas Waktu yang Diinginkan:
                                    </label>
                                    <select
                                        value={durasiBulan}
                                        onChange={(e) => setDurasiBulan(Number(e.target.value))}
                                        className="w-full text-xs border border-gray-300 p-2 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value={3}>3 Bulan (Intensif Kilat)</option>
                                        <option value={6}>6 Bulan (1 Semester)</option>
                                        <option value={12}>12 Bulan (1 Tahun Ajaran)</option>
                                        <option value={18}>18 Bulan (1.5 Tahun)</option>
                                        <option value={24}>24 Bulan (2 Tahun)</option>
                                        <option value={36}>36 Bulan (3 Tahun / Masa Tsanawi)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Hari Aktif Halaqah / Minggu:
                                    </label>
                                    <select
                                        value={hariAktifPerMinggu}
                                        onChange={(e) => setHariAktifPerMinggu(Number(e.target.value))}
                                        className="w-full text-xs border border-gray-300 p-2 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value={5}>5 Hari / Minggu (Libur Jum'at & Ahad)</option>
                                        <option value={6}>6 Hari / Minggu (Libur Jum'at saja)</option>
                                        <option value={7}>7 Hari / Minggu (Penuh Tanpa Libur)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Hasil Simulasi Cerdas */}
                            <div className="border border-emerald-300 bg-white p-5 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4 flex items-center justify-between">
                                    <span>Hasil Analisis Ritme Setoran & Muroja'ah</span>
                                    <span className="text-emerald-700 font-mono font-bold">Rekomendasi Mutaba'ah</span>
                                </h4>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                                    <div className="bg-gray-50 border border-gray-200 p-3">
                                        <span className="text-[10px] text-gray-500 uppercase block font-medium">Sisa Yang Harus Dihafal</span>
                                        <span className="text-xl font-bold text-emerald-900">{sisaJuz} <span className="text-xs font-normal">Juz</span></span>
                                        <span className="text-[10px] text-gray-500 block">({sisaHalaman} Halaman)</span>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-200 p-3">
                                        <span className="text-[10px] text-emerald-800 uppercase block font-semibold">Ziyadah Harian</span>
                                        <span className="text-xl font-bold text-emerald-900">{halamanPerHari} <span className="text-xs font-normal">Halaman</span></span>
                                        <span className="text-[10px] text-emerald-700 block">~{lembarPerHari} Lembar/Hari</span>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 p-3">
                                        <span className="text-[10px] text-amber-800 uppercase block font-semibold">Muroja'ah Wajib</span>
                                        <span className="text-xl font-bold text-amber-900">{rekomendasiMurojaah} <span className="text-xs font-normal">Juz</span></span>
                                        <span className="text-[10px] text-amber-700 block">per Hari (Bagi 2 sesi)</span>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 p-3">
                                        <span className="text-[10px] text-blue-800 uppercase block font-semibold">Estimasi Khatam</span>
                                        <span className="text-xs font-bold text-blue-900 block mt-1">{tanggalEstimasiFormat}</span>
                                        <span className="text-[9px] text-blue-600 block mt-0.5">Wisuda Tahfidz</span>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-700 bg-gray-50 p-3 border border-gray-200 leading-relaxed">
                                    <strong className="text-emerald-900">Tips Sukses Mutqin:</strong> Santri disarankan membagi target{' '}
                                    <span className="font-semibold text-emerald-800">{halamanPerHari} halaman ziyadah</span> ke waktu 
                                    Ba'da Subuh, dan mengulang hafalan lama ({rekomendasiMurojaah} Juz) pada waktu Ba'da Maghrib/Isya bersama Musyrif.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: AUDIO MURATTAL & MUROJA'AH */}
                    {activeTab === 'audio' && (
                        <div className="space-y-5">
                            <div className="bg-emerald-50 border border-emerald-200 p-4">
                                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                    <i className="fa-solid fa-volume-high text-emerald-700"></i>
                                    <span>Pemutar Murattal Al-Qur'an 30 Juz (Syaikh Mishary Rashid Alafasy)</span>
                                </h3>
                                <p className="text-xs text-emerald-800 mt-1">
                                    Dengarkan bacaan tartil standar internasional untuk memperbaiki makhorijul huruf, 
                                    menyempurnakan waqaf & ibtida', serta melancarkan hafalan mandiri.
                                </p>
                            </div>

                            {/* Pemilihan Surat */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Pilih Surat Al-Qur'an (1 - 114):
                                </label>
                                <select
                                    value={selectedSurahNomor}
                                    onChange={(e) => {
                                        setSelectedSurahNomor(Number(e.target.value));
                                        setIsPlaying(false);
                                    }}
                                    className="w-full text-xs border border-gray-300 p-2.5 focus:ring-1 focus:ring-emerald-600 outline-none font-sans"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} Ayat) — Juz {s.juz}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Player Card */}
                            <div className="border border-emerald-300 bg-white p-5 text-center">
                                <div className="font-arab text-3xl sm:text-4xl text-emerald-900 mb-1 font-bold">
                                    سُورَةُ {selectedSurah.nama}
                                </div>
                                <h4 className="text-base font-bold text-gray-900">
                                    Surat {selectedSurah.nama}
                                </h4>
                                <p className="text-xs text-gray-500 font-mono">
                                    Surat ke-{selectedSurah.nomor} | {selectedSurah.ayat} Ayat | Juz {selectedSurah.juz}
                                </p>

                                {/* Audio Element */}
                                <audio
                                    ref={audioRef}
                                    src={audioSource}
                                    onEnded={() => setIsPlaying(false)}
                                    onError={() => {
                                        setAudioError("Tidak dapat memuat audio surat. Pastikan jaringan internet aktif.");
                                        setIsPlaying(false);
                                    }}
                                    preload="none"
                                />

                                {audioError && (
                                    <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 border border-red-200">
                                        <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                        {audioError}
                                    </div>
                                )}

                                {/* Kontrol Playback */}
                                <div className="flex items-center justify-center gap-3 my-5">
                                    {!isPlaying ? (
                                        <button
                                            type="button"
                                            onClick={handlePlayAudio}
                                            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition flex items-center gap-2 shadow"
                                        >
                                            <i className="fa-solid fa-play"></i>
                                            <span>Putar Tilawah Surat</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handlePauseAudio}
                                            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow"
                                        >
                                            <i className="fa-solid fa-pause"></i>
                                            <span>Jeda Audio (Pause)</span>
                                        </button>
                                    )}
                                </div>

                                {/* Kontrol Kecepatan Muroja'ah */}
                                <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-center gap-2 text-xs">
                                    <span className="text-gray-500 font-medium">Kecepatan Putar:</span>
                                    {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => handleChangePlaybackRate(rate)}
                                            className={`px-2.5 py-1 text-xs font-semibold border transition ${
                                                playbackRate === rate
                                                    ? 'bg-emerald-850 text-white border-emerald-900'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            {rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: BACKUP & RESTORE DATA PESANTREN */}
                    {activeTab === 'backup' && (
                        <div className="space-y-5">
                            <div className="bg-emerald-50 border border-emerald-200 p-4">
                                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                    <i className="fa-solid fa-shield-halved text-emerald-700"></i>
                                    <span>Pencadangan & Pemulihan Basis Data Lembaga (Enterprise Backup)</span>
                                </h3>
                                <p className="text-xs text-emerald-800 mt-1">
                                    Jamin keamanan data pesantren dengan mengunduh snapshot data santri, mutaba'ah, 
                                    setoran resmi, kelas tahfidz, dan mata pelajaran secara berkala.
                                </p>
                            </div>

                            {backupStatus && (
                                <div className="bg-emerald-100 border border-emerald-300 p-3 text-xs text-emerald-900 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-check text-emerald-700 text-sm"></i>
                                    <span>{backupStatus}</span>
                                </div>
                            )}

                            {restoreError && (
                                <div className="bg-red-50 border border-red-300 p-3 text-xs text-red-900 flex items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation text-red-700 text-sm"></i>
                                    <span>{restoreError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Unduh Cadangan */}
                                <div className="border border-gray-200 p-5 bg-white space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                                        <i className="fa-solid fa-cloud-arrow-down text-lg"></i>
                                        <span>Unduh Cadangan JSON</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Ekspor seluruh rekaman data aktif saat ini ({allSantri.length} santri, {allSetoran.length} setoran, {allKelas.length} kelas) 
                                        ke dalam 1 file JSON mandiri untuk disimpan di arsip komputer/drive pesantren.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleDownloadBackup}
                                        className="w-full py-2.5 px-4 bg-emerald-850 hover:bg-emerald-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow"
                                    >
                                        <i className="fa-solid fa-download"></i>
                                        <span>Unduh Berkas Cadangan (.json)</span>
                                    </button>
                                </div>

                                {/* Pulihkan Cadangan */}
                                <div className="border border-gray-200 p-5 bg-white space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                                        <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
                                        <span>Pulihkan Data dari JSON</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Unggah kembali file cadangan JSON yang pernah diunduh sebelumnya untuk mengembalikan 
                                        seluruh data pesantren bila terjadi kesalahan atau pergantian perangkat.
                                    </p>
                                    <label className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow cursor-pointer text-center">
                                        <i className="fa-solid fa-upload"></i>
                                        <span>Pilih Berkas Cadangan JSON</span>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleFileRestore}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        Pondok Pesantren Darul Kamal — Dikembangkan untuk M. Asngad (Administrator)
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
