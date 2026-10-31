import React, { useState } from 'react';
import { User, Santri, KelasTahfidz, MataPelajaranTahfidz } from '../types';
import { syncKelasDoc, deleteKelasDoc, syncMapelDoc, deleteMapelDoc } from '../services/firebaseService';

interface KelasMapelModuleProps {
    isAdmin: boolean;
    isUstadz: boolean;
    isSantri: boolean;
    user: User | null;
    currentSantri: Santri;
    santriList: Santri[];
    kelasList: KelasTahfidz[];
    setKelasList: React.Dispatch<React.SetStateAction<KelasTahfidz[]>>;
    mapelList: MataPelajaranTahfidz[];
    setMapelList: React.Dispatch<React.SetStateAction<MataPelajaranTahfidz[]>>;
    onOpenSetoranForSantri?: (santriId: string) => void;
    onNavigateTab?: (tab: any) => void;
}

export const KelasMapelModule: React.FC<KelasMapelModuleProps> = ({
    isAdmin,
    isUstadz,
    isSantri,
    user,
    currentSantri,
    santriList,
    kelasList,
    setKelasList,
    mapelList,
    setMapelList,
    onOpenSetoranForSantri,
    onNavigateTab
}) => {
    // Admin Sub-tab
    const [adminSubTab, setAdminSubTab] = useState<'kelas' | 'mapel' | 'rekap'>('kelas');

    // Filter states
    const [searchKelasQuery, setSearchKelasQuery] = useState('');
    const [filterTingkat, setFilterTingkat] = useState<string>('Semua');
    const [searchMapelQuery, setSearchMapelQuery] = useState('');
    const [filterHariMapel, setFilterHariMapel] = useState<string>('Semua');
    const [filterKelasMapel, setFilterKelasMapel] = useState<string>('Semua');

    // Ustadz filter: 'binaan' vs 'semua'
    const [ustadzKelasFilter, setUstadzKelasFilter] = useState<'binaan' | 'semua'>('binaan');

    // Modal states - Kelas
    const [isAddKelasOpen, setIsAddKelasOpen] = useState(false);
    const [isEditKelasOpen, setIsEditKelasOpen] = useState(false);
    const [editKelasTarget, setEditKelasTarget] = useState<KelasTahfidz | null>(null);
    const [deleteKelasTarget, setDeleteKelasTarget] = useState<KelasTahfidz | null>(null);
    const [viewSantriKelas, setViewSantriKelas] = useState<KelasTahfidz | null>(null);

    // Form states - Kelas
    const [formNamaKelas, setFormNamaKelas] = useState('');
    const [formTingkat, setFormTingkat] = useState<'Ula / I\'dad' | 'Wustha' | 'Ulya' | 'Takhassus 30 Juz' | string>('Ula / I\'dad');
    const [formWaliKelas, setFormWaliKelas] = useState('Ustadz Abdullah Mukhtar, S.Pd.I');
    const [formRuangan, setFormRuangan] = useState('Gedung Tahfidz Lt. 1 - Ruang Al-Fatihah');
    const [formKapasitas, setFormKapasitas] = useState('20');
    const [formTargetJuz, setFormTargetJuz] = useState('5');
    const [formTahunAjaran, setFormTahunAjaran] = useState('1447-1448 H / 2026-2027');
    const [formJadwalHalaqah, setFormJadwalHalaqah] = useState('Ba\'da Subuh (05:15 - 06:45) & Ba\'da Ashar (16:00 - 17:15)');
    const [formKeteranganKelas, setFormKeteranganKelas] = useState('');

    // Modal states - Mapel
    const [isAddMapelOpen, setIsAddMapelOpen] = useState(false);
    const [isEditMapelOpen, setIsEditMapelOpen] = useState(false);
    const [editMapelTarget, setEditMapelTarget] = useState<MataPelajaranTahfidz | null>(null);
    const [deleteMapelTarget, setDeleteMapelTarget] = useState<MataPelajaranTahfidz | null>(null);

    // Form states - Mapel
    const [formKodeMapel, setFormKodeMapel] = useState('TJW-102');
    const [formNamaMapel, setFormNamaMapel] = useState('');
    const [formKitabRujukan, setFormKitabRujukan] = useState('');
    const [formUstadzPengampu, setFormUstadzPengampu] = useState('Ustadz Abdullah Mukhtar, S.Pd.I');
    const [formMapelKelasId, setFormMapelKelasId] = useState('all');
    const [formHariMapel, setFormHariMapel] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jum\'at' | 'Sabtu' | 'Ahad' | string>('Senin');
    const [formJamMulai, setFormJamMulai] = useState('08:00');
    const [formJamSelesai, setFormJamSelesai] = useState('09:30');
    const [formRuanganMapel, setFormRuanganMapel] = useState('Ruang Al-Fatihah');
    const [formBobotSks, setFormBobotSks] = useState('2');
    const [formDeskripsiMapel, setFormDeskripsiMapel] = useState('');
    const [formSilabusText, setFormSilabusText] = useState('');

    // Teacher lesson journal modal
    const [selectedMapelForJournal, setSelectedMapelForJournal] = useState<MataPelajaranTahfidz | null>(null);
    const [journalBabPertemuan, setJournalBabPertemuan] = useState('');
    const [journalCatatanUstadz, setJournalCatatanUstadz] = useState('');
    const [journalSuccessMessage, setJournalSuccessMessage] = useState('');

    // Helper: Find Santri belonging to a class
    const getSantriForKelas = (kelas: KelasTahfidz): Santri[] => {
        return santriList.filter(s => {
            if (!s.kelas) return false;
            const sk = s.kelas.toLowerCase();
            const nk = kelas.namaKelas.toLowerCase();
            return sk.includes(nk) || nk.includes(sk) ||
                (kelas.id === 'kls-1' && (sk.includes('ula') || sk.includes('dasar'))) ||
                (kelas.id === 'kls-2' && (sk.includes('wustho') || sk.includes('menengah'))) ||
                (kelas.id === 'kls-3' && (sk.includes('ulya') || sk.includes('lanjut'))) ||
                (kelas.id === 'kls-4' && (sk.includes('takhassus') || sk.includes('30 juz') || sk.includes('mutqin')));
        });
    };

    // Current santri's class
    const myKelas: KelasTahfidz | undefined = kelasList.find(k => {
        if (!currentSantri?.kelas) return false;
        const sk = currentSantri.kelas.toLowerCase();
        const nk = k.namaKelas.toLowerCase();
        return sk.includes(nk) || nk.includes(sk) ||
            (k.id === 'kls-1' && (sk.includes('ula') || sk.includes('dasar'))) ||
            (k.id === 'kls-2' && (sk.includes('wustho') || sk.includes('menengah'))) ||
            (k.id === 'kls-3' && (sk.includes('ulya') || sk.includes('lanjut'))) ||
            (k.id === 'kls-4' && (sk.includes('takhassus') || sk.includes('30 juz')));
    }) || kelasList[0];

    // Classmates of the current santri
    const myClassmates: Santri[] = myKelas ? getSantriForKelas(myKelas) : [];

    // Mapel taken by current santri
    const myMapelList: MataPelajaranTahfidz[] = mapelList.filter(m => {
        if (m.kelasId === 'all') return true;
        if (!myKelas) return false;
        return m.kelasId === myKelas.id || m.namaKelas.toLowerCase().includes(myKelas.namaKelas.toLowerCase());
    });

    // Classes mentored by current ustadz
    const ustadzName = user?.nama || 'Ustadz Abdullah Mukhtar, S.Pd.I';
    const myMentoredClasses: KelasTahfidz[] = kelasList.filter(k => {
        return k.waliKelas.toLowerCase().includes(ustadzName.toLowerCase()) ||
            ustadzName.toLowerCase().includes(k.waliKelas.toLowerCase()) ||
            (k.waliKelas.includes('Abdullah') && ustadzName.includes('Abdullah'));
    });

    // Mapel taught by current ustadz
    const myTaughtMapel: MataPelajaranTahfidz[] = mapelList.filter(m => {
        return m.ustadzPengampu.toLowerCase().includes(ustadzName.toLowerCase()) ||
            ustadzName.toLowerCase().includes(m.ustadzPengampu.toLowerCase()) ||
            (m.ustadzPengampu.includes('Abdullah') && ustadzName.includes('Abdullah'));
    });

    // ==========================================
    // HANDLERS KELAS TAHFIDZ
    // ==========================================
    const handleSaveNewKelas = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = `kls-${Date.now()}`;
        const newK: KelasTahfidz = {
            id: newId,
            namaKelas: formNamaKelas.trim(),
            tingkat: formTingkat,
            waliKelas: formWaliKelas.trim(),
            ruangan: formRuangan.trim(),
            kapasitas: parseInt(formKapasitas) || 20,
            targetJuzMinimal: parseInt(formTargetJuz) || 5,
            tahunAjaran: formTahunAjaran.trim(),
            jadwalHalaqah: formJadwalHalaqah.trim(),
            keterangan: formKeteranganKelas.trim()
        };

        const updated = [...kelasList, newK];
        setKelasList(updated);
        localStorage.setItem('darul_kamal_kelas_list', JSON.stringify(updated));
        syncKelasDoc(newK);
        setIsAddKelasOpen(false);
        resetKelasForm();
    };

    const handleOpenEditKelas = (kelas: KelasTahfidz) => {
        setEditKelasTarget(kelas);
        setFormNamaKelas(kelas.namaKelas);
        setFormTingkat(kelas.tingkat);
        setFormWaliKelas(kelas.waliKelas);
        setFormRuangan(kelas.ruangan);
        setFormKapasitas(String(kelas.kapasitas));
        setFormTargetJuz(String(kelas.targetJuzMinimal));
        setFormTahunAjaran(kelas.tahunAjaran);
        setFormJadwalHalaqah(kelas.jadwalHalaqah || '');
        setFormKeteranganKelas(kelas.keterangan || '');
        setIsEditKelasOpen(true);
    };

    const handleUpdateKelas = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editKelasTarget) return;

        const updatedKelas: KelasTahfidz = {
            ...editKelasTarget,
            namaKelas: formNamaKelas.trim(),
            tingkat: formTingkat,
            waliKelas: formWaliKelas.trim(),
            ruangan: formRuangan.trim(),
            kapasitas: parseInt(formKapasitas) || 20,
            targetJuzMinimal: parseInt(formTargetJuz) || 5,
            tahunAjaran: formTahunAjaran.trim(),
            jadwalHalaqah: formJadwalHalaqah.trim(),
            keterangan: formKeteranganKelas.trim()
        };

        const updated = kelasList.map(k => k.id === editKelasTarget.id ? updatedKelas : k);
        setKelasList(updated);
        localStorage.setItem('darul_kamal_kelas_list', JSON.stringify(updated));
        syncKelasDoc(updatedKelas);
        setIsEditKelasOpen(false);
        setEditKelasTarget(null);
        resetKelasForm();
    };

    const handleConfirmDeleteKelas = () => {
        if (!deleteKelasTarget) return;
        const updated = kelasList.filter(k => k.id !== deleteKelasTarget.id);
        setKelasList(updated);
        localStorage.setItem('darul_kamal_kelas_list', JSON.stringify(updated));
        deleteKelasDoc(deleteKelasTarget.id);
        setDeleteKelasTarget(null);
    };

    const resetKelasForm = () => {
        setFormNamaKelas('');
        setFormTingkat('Ula / I\'dad');
        setFormWaliKelas('Ustadz Abdullah Mukhtar, S.Pd.I');
        setFormRuangan('Gedung Tahfidz Lt. 1 - Ruang Al-Fatihah');
        setFormKapasitas('20');
        setFormTargetJuz('5');
        setFormTahunAjaran('1447-1448 H / 2026-2027');
        setFormJadwalHalaqah('Ba\'da Subuh (05:15 - 06:45) & Ba\'da Ashar (16:00 - 17:15)');
        setFormKeteranganKelas('');
    };

    // ==========================================
    // HANDLERS MATA PELAJARAN
    // ==========================================
    const handleSaveNewMapel = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = `mpl-${Date.now()}`;
        const targetKelas = kelasList.find(k => k.id === formMapelKelasId);
        const silabusArr = formSilabusText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);

        const newM: MataPelajaranTahfidz = {
            id: newId,
            kodeMapel: formKodeMapel.trim().toUpperCase(),
            namaMapel: formNamaMapel.trim(),
            kitabRujukan: formKitabRujukan.trim(),
            ustadzPengampu: formUstadzPengampu.trim(),
            kelasId: formMapelKelasId,
            namaKelas: formMapelKelasId === 'all' ? 'Semua Kelas Tahfidz' : (targetKelas?.namaKelas || 'Kelas Pilihan'),
            hari: formHariMapel,
            jamMulai: formJamMulai,
            jamSelesai: formJamSelesai,
            ruangan: formRuanganMapel.trim(),
            bobotSks: parseInt(formBobotSks) || 2,
            deskripsi: formDeskripsiMapel.trim(),
            silabus: silabusArr.length > 0 ? silabusArr : ['Pengenalan Materi Dasar', 'Talaqqi Bab 1', 'Evaluasi Pemahaman']
        };

        const updated = [...mapelList, newM];
        setMapelList(updated);
        localStorage.setItem('darul_kamal_mapel_list', JSON.stringify(updated));
        syncMapelDoc(newM);
        setIsAddMapelOpen(false);
        resetMapelForm();
    };

    const handleOpenEditMapel = (mapel: MataPelajaranTahfidz) => {
        setEditMapelTarget(mapel);
        setFormKodeMapel(mapel.kodeMapel);
        setFormNamaMapel(mapel.namaMapel);
        setFormKitabRujukan(mapel.kitabRujukan);
        setFormUstadzPengampu(mapel.ustadzPengampu);
        setFormMapelKelasId(mapel.kelasId);
        setFormHariMapel(mapel.hari);
        setFormJamMulai(mapel.jamMulai);
        setFormJamSelesai(mapel.jamSelesai);
        setFormRuanganMapel(mapel.ruangan);
        setFormBobotSks(String(mapel.bobotSks || 2));
        setFormDeskripsiMapel(mapel.deskripsi || '');
        setFormSilabusText((mapel.silabus || []).join('\n'));
        setIsEditMapelOpen(true);
    };

    const handleUpdateMapel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMapelTarget) return;

        const targetKelas = kelasList.find(k => k.id === formMapelKelasId);
        const silabusArr = formSilabusText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);

        const updatedM: MataPelajaranTahfidz = {
            ...editMapelTarget,
            kodeMapel: formKodeMapel.trim().toUpperCase(),
            namaMapel: formNamaMapel.trim(),
            kitabRujukan: formKitabRujukan.trim(),
            ustadzPengampu: formUstadzPengampu.trim(),
            kelasId: formMapelKelasId,
            namaKelas: formMapelKelasId === 'all' ? 'Semua Kelas Tahfidz' : (targetKelas?.namaKelas || 'Kelas Pilihan'),
            hari: formHariMapel,
            jamMulai: formJamMulai,
            jamSelesai: formJamSelesai,
            ruangan: formRuanganMapel.trim(),
            bobotSks: parseInt(formBobotSks) || 2,
            deskripsi: formDeskripsiMapel.trim(),
            silabus: silabusArr
        };

        const updated = mapelList.map(m => m.id === editMapelTarget.id ? updatedM : m);
        setMapelList(updated);
        localStorage.setItem('darul_kamal_mapel_list', JSON.stringify(updated));
        syncMapelDoc(updatedM);
        setIsEditMapelOpen(false);
        setEditMapelTarget(null);
        resetMapelForm();
    };

    const handleConfirmDeleteMapel = () => {
        if (!deleteMapelTarget) return;
        const updated = mapelList.filter(m => m.id !== deleteMapelTarget.id);
        setMapelList(updated);
        localStorage.setItem('darul_kamal_mapel_list', JSON.stringify(updated));
        deleteMapelDoc(deleteMapelTarget.id);
        setDeleteMapelTarget(null);
    };

    const resetMapelForm = () => {
        setFormKodeMapel('TJW-102');
        setFormNamaMapel('');
        setFormKitabRujukan('');
        setFormUstadzPengampu('Ustadz Abdullah Mukhtar, S.Pd.I');
        setFormMapelKelasId('all');
        setFormHariMapel('Senin');
        setFormJamMulai('08:00');
        setFormJamSelesai('09:30');
        setFormRuanganMapel('Ruang Al-Fatihah');
        setFormBobotSks('2');
        setFormDeskripsiMapel('');
        setFormSilabusText('');
    };

    const handleSaveTeacherJournal = (e: React.FormEvent) => {
        e.preventDefault();
        setJournalSuccessMessage(`Catatan pertemuan materi "${journalBabPertemuan}" untuk mapel ${selectedMapelForJournal?.namaMapel} berhasil disimpan dan disiarkan ke santri.`);
        setTimeout(() => {
            setJournalSuccessMessage('');
            setSelectedMapelForJournal(null);
            setJournalBabPertemuan('');
            setJournalCatatanUstadz('');
        }, 2200);
    };

    // Filtered lists for Admin view
    const filteredKelas = kelasList.filter(k => {
        const matchesQuery = k.namaKelas.toLowerCase().includes(searchKelasQuery.toLowerCase()) ||
            k.waliKelas.toLowerCase().includes(searchKelasQuery.toLowerCase()) ||
            k.ruangan.toLowerCase().includes(searchKelasQuery.toLowerCase());
        const matchesTingkat = filterTingkat === 'Semua' || k.tingkat === filterTingkat;
        return matchesQuery && matchesTingkat;
    });

    const filteredMapel = mapelList.filter(m => {
        const matchesQuery = m.namaMapel.toLowerCase().includes(searchMapelQuery.toLowerCase()) ||
            m.kitabRujukan.toLowerCase().includes(searchMapelQuery.toLowerCase()) ||
            m.kodeMapel.toLowerCase().includes(searchMapelQuery.toLowerCase()) ||
            m.ustadzPengampu.toLowerCase().includes(searchMapelQuery.toLowerCase());
        const matchesHari = filterHariMapel === 'Semua' || m.hari === filterHariMapel;
        const matchesKelas = filterKelasMapel === 'Semua' || m.kelasId === filterKelasMapel || (filterKelasMapel !== 'Semua' && m.kelasId === 'all');
        return matchesQuery && matchesHari && matchesKelas;
    });

    // Total capacity & occupancy
    const totalCapacity = kelasList.reduce((acc, k) => acc + (k.kapasitas || 0), 0);
    const totalEnrolled = santriList.length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-800">
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold shadow-xs inline-flex items-center gap-1.5 ${
                            isAdmin ? 'bg-amber-400 text-amber-950 border border-amber-300' :
                            isUstadz ? 'bg-blue-400 text-blue-950 border border-blue-300' :
                            'bg-emerald-400 text-emerald-950 border border-emerald-300'
                        }`}>
                            <i className={`fas ${isAdmin ? 'fa-graduation-cap' : isUstadz ? 'fa-chalkboard-teacher' : 'fa-book-reader'}`}></i>
                            {isAdmin ? 'Modul Admin: Manajemen Kelas & Kurikulum' :
                             isUstadz ? 'Modul Ustadz: Kelas Binaan & Jadwal Mengajar' :
                             'Modul Santri: Kelas & Mata Pelajaran Saya'}
                        </span>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-emerald-200">
                            Tahun Ajaran 1447-1448 H / 2026-2027
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold">
                        {isAdmin && 'Sentra Pengelolaan Kelas Tahfidz & Kurikulum Pesantren'}
                        {isUstadz && `Bimbingan Kelas Halaqah & Mata Pelajaran — ${ustadzName}`}
                        {isSantri && `Informasi Kelas Tahfidz & Jadwal Pembelajaran — ${currentSantri?.nama}`}
                    </h3>
                    <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                        {isAdmin && 'Konfigurasi pembagian kelas tahfidz santri, kapasitas ruangan, pemantauan rasio santri per rombel, dan mata pelajaran kepesantrenan.'}
                        {isUstadz && 'Pantau santri di bawah binaan kelas Anda, evaluasi kelancaran hafalan, dan kelola agenda pembelajaran tatap muka mapel tajwid & kitab.'}
                        {isSantri && 'Cek jadwal mata pelajaran tahfidz, ruang belajar, kitab panduan, dan kenali rekan-rekan santri di kelas Anda untuk fastabiqul khairat.'}
                    </p>
                </div>
                <div className="absolute right-4 -bottom-6 text-white/5 font-arab text-9xl pointer-events-none select-none">
                    الفصول
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 1. TAMPILAN KHUSUS MODUL ADMINISTRATOR (M. ASNGAD)                         */}
            {/* ========================================================================= */}
            {isAdmin && (
                <div className="space-y-6">
                    {/* Executive Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Kelas Tahfidz</span>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{kelasList.length} <span className="text-xs font-normal text-gray-500">Kelas</span></div>
                                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                                    <i className="fas fa-check-circle mr-1"></i> Aktif Berjalan
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shadow-inner">
                                <i className="fas fa-school"></i>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Santri Terdaftar</span>
                                <div className="text-2xl font-bold text-teal-800 mt-1">
                                    {totalEnrolled} <span className="text-xs font-normal text-gray-500">/ {totalCapacity} Kapasitas</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className="bg-teal-600 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(100, Math.round((totalEnrolled / (totalCapacity || 1)) * 100))}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl shadow-inner">
                                <i className="fas fa-users"></i>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Mata Pelajaran Tahfidz</span>
                                <div className="text-2xl font-bold text-blue-900 mt-1">{mapelList.length} <span className="text-xs font-normal text-gray-500">Mapel</span></div>
                                <p className="text-[11px] text-blue-700 font-semibold mt-1">
                                    <i className="fas fa-book mr-1"></i> Kurikulum Kepesantrenan
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl shadow-inner">
                                <i className="fas fa-book-open"></i>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Rata-Rata Santri / Rombel</span>
                                <div className="text-2xl font-bold text-amber-900 mt-1">
                                    {(totalEnrolled / (kelasList.length || 1)).toFixed(1)} <span className="text-xs font-normal text-gray-500">Santri</span>
                                </div>
                                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                                    <i className="fas fa-balance-scale mr-1"></i> Kondusif &amp; Terbimbing
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shadow-inner">
                                <i className="fas fa-chalkboard-teacher"></i>
                            </div>
                        </div>
                    </div>

                    {/* Admin Navigation Sub-tabs */}
                    <div className="flex border-b border-gray-200 bg-white p-1 rounded-2xl shadow-xs gap-1">
                        <button
                            onClick={() => setAdminSubTab('kelas')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                adminSubTab === 'kelas'
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-chalkboard"></i>
                            <span>Daftar Kelas Tahfidz ({kelasList.length})</span>
                        </button>
                        <button
                            onClick={() => setAdminSubTab('mapel')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                adminSubTab === 'mapel'
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-book-quran"></i>
                            <span>Mata Pelajaran &amp; Kitab ({mapelList.length})</span>
                        </button>
                        <button
                            onClick={() => setAdminSubTab('rekap')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                adminSubTab === 'rekap'
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <i className="fas fa-chart-pie"></i>
                            <span>Rekapitulasi Beban Pengampu</span>
                        </button>
                    </div>

                    {/* SUB-TAB 1: KELAS TAHFIDZ (ADMIN) */}
                    {adminSubTab === 'kelas' && (
                        <div className="space-y-4">
                            {/* Toolbar & Action */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <i className="fas fa-search absolute left-3.5 top-3 text-gray-400 text-xs"></i>
                                        <input 
                                            type="text"
                                            placeholder="Cari nama kelas, wali kelas, ruangan..."
                                            value={searchKelasQuery}
                                            onChange={(e) => setSearchKelasQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <select
                                        value={filterTingkat}
                                        onChange={(e) => setFilterTingkat(e.target.value)}
                                        className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Semua">Semua Tingkat</option>
                                        <option value="Ula / I'dad">Ula / I'dad</option>
                                        <option value="Wustha">Wustha</option>
                                        <option value="Ulya">Ulya</option>
                                        <option value="Takhassus 30 Juz">Takhassus 30 Juz</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        resetKelasForm();
                                        setIsAddKelasOpen(true);
                                    }}
                                    className="w-full md:w-auto bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                                >
                                    <i className="fas fa-plus-circle"></i>
                                    <span>Buka Kelas Tahfidz Baru</span>
                                </button>
                            </div>

                            {/* Grid Kelas Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredKelas.map(k => {
                                    const classStudents = getSantriForKelas(k);
                                    const occupancyPercent = Math.min(100, Math.round((classStudents.length / (k.kapasitas || 1)) * 100));

                                    return (
                                        <div key={k.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                            k.tingkat.includes('Takhassus') ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                            k.tingkat.includes('Ulya') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                            k.tingkat.includes('Wustha') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        }`}>
                                                            {k.tingkat}
                                                        </span>
                                                        <h4 className="font-bold text-gray-900 text-base mt-1.5">{k.namaKelas}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenEditKelas(k)}
                                                            className="text-gray-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
                                                            title="Edit Kelas"
                                                        >
                                                            <i className="fas fa-edit text-xs"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteKelasTarget(k)}
                                                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                                                            title="Hapus Kelas"
                                                        >
                                                            <i className="fas fa-trash-alt text-xs"></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 text-xs text-gray-600 my-3">
                                                    <div className="flex items-center gap-2">
                                                        <i className="fas fa-user-tie w-4 text-emerald-700"></i>
                                                        <span>Wali Kelas: <strong>{k.waliKelas}</strong></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <i className="fas fa-map-marker-alt w-4 text-emerald-700"></i>
                                                        <span>Ruangan: {k.ruangan}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <i className="fas fa-clock w-4 text-emerald-700"></i>
                                                        <span>Jadwal: {k.jadwalHalaqah || 'Ba\'da Subuh & Ashar'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <i className="fas fa-flag-checkered w-4 text-emerald-700"></i>
                                                        <span>Target Minimal: <strong>{k.targetJuzMinimal} Juz Sah</strong></span>
                                                    </div>
                                                </div>

                                                {/* Kapasitas dan Jumlah Santri Bar */}
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 my-3">
                                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                                        <span className="text-gray-700 flex items-center gap-1.5">
                                                            <i className="fas fa-users text-teal-700"></i>
                                                            Jumlah Santri:
                                                        </span>
                                                        <span className="text-gray-900 font-bold">
                                                            {classStudents.length} / {k.kapasitas} Santri ({occupancyPercent}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                occupancyPercent >= 90 ? 'bg-amber-500' : 'bg-emerald-600'
                                                            }`}
                                                            style={{ width: `${occupancyPercent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {k.keterangan && (
                                                    <p className="text-[11px] text-gray-500 italic mt-1 bg-white">
                                                        "{k.keterangan}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 mt-3 flex justify-between items-center">
                                                <span className="text-[10px] text-gray-400 font-mono">ID: {k.id}</span>
                                                <button
                                                    onClick={() => setViewSantriKelas(k)}
                                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                                >
                                                    <i className="fas fa-list-ul"></i>
                                                    <span>Daftar Santri ({classStudents.length})</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB 2: MATA PELAJARAN (ADMIN) */}
                    {adminSubTab === 'mapel' && (
                        <div className="space-y-4">
                            {/* Toolbar & Action Mapel */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <i className="fas fa-search absolute left-3.5 top-3 text-gray-400 text-xs"></i>
                                        <input 
                                            type="text"
                                            placeholder="Cari nama mapel, kitab, ustadz..."
                                            value={searchMapelQuery}
                                            onChange={(e) => setSearchMapelQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <select
                                        value={filterHariMapel}
                                        onChange={(e) => setFilterHariMapel(e.target.value)}
                                        className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Semua">Semua Hari</option>
                                        <option value="Senin">Senin</option>
                                        <option value="Selasa">Selasa</option>
                                        <option value="Rabu">Rabu</option>
                                        <option value="Kamis">Kamis</option>
                                        <option value="Jum'at">Jum'at</option>
                                        <option value="Sabtu">Sabtu</option>
                                        <option value="Ahad">Ahad</option>
                                    </select>
                                    <select
                                        value={filterKelasMapel}
                                        onChange={(e) => setFilterKelasMapel(e.target.value)}
                                        className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Semua">Semua Sasaran Kelas</option>
                                        <option value="all">Semua Kelas (Gabungan)</option>
                                        {kelasList.map(k => (
                                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        resetMapelForm();
                                        setIsAddMapelOpen(true);
                                    }}
                                    className="w-full md:w-auto bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                                >
                                    <i className="fas fa-plus-circle"></i>
                                    <span>Tambah Mata Pelajaran Baru</span>
                                </button>
                            </div>

                            {/* Table Mapel */}
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                                                <th className="p-3.5">Kode &amp; Mapel</th>
                                                <th className="p-3.5">Kitab Rujukan</th>
                                                <th className="p-3.5">Ustadz Pengampu</th>
                                                <th className="p-3.5">Sasaran Kelas</th>
                                                <th className="p-3.5">Jadwal &amp; Ruangan</th>
                                                <th className="p-3.5 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredMapel.map(m => (
                                                <tr key={m.id} className="hover:bg-gray-50/80 transition">
                                                    <td className="p-3.5">
                                                        <span className="font-mono text-[10px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold mr-1">
                                                            {m.kodeMapel}
                                                        </span>
                                                        <div className="font-bold text-gray-900 mt-1">{m.namaMapel}</div>
                                                        <span className="text-[10px] text-gray-500 font-medium">{m.bobotSks} JP / SKS</span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 block max-w-xs truncate">
                                                            <i className="fas fa-book mr-1.5 text-emerald-700"></i>
                                                            {m.kitabRujukan}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 font-medium text-gray-800">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">
                                                                <i className="fas fa-user-tie"></i>
                                                            </div>
                                                            <span>{m.ustadzPengampu}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            m.kelasId === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                                                        }`}>
                                                            {m.namaKelas}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-gray-800">
                                                            <i className="fas fa-calendar-day mr-1 text-gray-400"></i> {m.hari}, {m.jamMulai} - {m.jamSelesai}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                                            <i className="fas fa-door-open mr-1 text-gray-400"></i> {m.ruangan}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleOpenEditMapel(m)}
                                                                className="text-gray-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
                                                                title="Edit Mapel"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteMapelTarget(m)}
                                                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                                                                title="Hapus Mapel"
                                                            >
                                                                <i className="fas fa-trash-alt"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB 3: REKAP BEBAN PENGAJARAN (ADMIN) */}
                    {adminSubTab === 'rekap' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <i className="fas fa-chart-bar text-emerald-700"></i> Distribusi Mengajar Asatidz Pondok Pesantren Darul Kamal
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Matriks ketersebaran kelas asuhan dan alokasi mata pelajaran kepesantrenan untuk menjamin rasio bimbingan tahfidz yang proporsional.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {Array.from(new Set([
                                    ...kelasList.map(k => k.waliKelas),
                                    ...mapelList.map(m => m.ustadzPengampu)
                                ])).map((ustadz, idx) => {
                                    const classesLed = kelasList.filter(k => k.waliKelas === ustadz);
                                    const mapelsTaught = mapelList.filter(m => m.ustadzPengampu === ustadz);
                                    const totalStudentMentored = classesLed.reduce((acc, k) => acc + getSantriForKelas(k).length, 0);

                                    return (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                                                    {ustadz.charAt(0)}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-gray-900 text-sm">{ustadz}</h5>
                                                    <span className="text-[11px] text-gray-500">Dewan Pengajar Tahfidz &amp; Kitab</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 text-center">
                                                <div className="bg-white p-2 rounded-lg border border-gray-100">
                                                    <span className="text-[10px] text-gray-500 block">Kelas Binaan</span>
                                                    <strong className="text-emerald-800 text-sm">{classesLed.length}</strong>
                                                </div>
                                                <div className="bg-white p-2 rounded-lg border border-gray-100">
                                                    <span className="text-[10px] text-gray-500 block">Mata Pelajaran</span>
                                                    <strong className="text-blue-800 text-sm">{mapelsTaught.length}</strong>
                                                </div>
                                                <div className="bg-white p-2 rounded-lg border border-gray-100">
                                                    <span className="text-[10px] text-gray-500 block">Total Santri Binaan</span>
                                                    <strong className="text-teal-800 text-sm">{totalStudentMentored}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* 2. TAMPILAN KHUSUS MODUL USTADZ (MUSYRIF / PENGAJAR)                      */}
            {/* ========================================================================= */}
            {isUstadz && (
                <div className="space-y-6">
                    {/* Welcome Card & Summary */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl shadow-inner">
                                <i className="fas fa-chalkboard-teacher"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-base">{ustadzName}</h4>
                                <p className="text-xs text-gray-500">
                                    Membina <strong>{myMentoredClasses.length} Kelas Tahfidz</strong> dan mengampu <strong>{myTaughtMapel.length} Mata Pelajaran</strong>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setUstadzKelasFilter('binaan')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    ustadzKelasFilter === 'binaan' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Kelas Asuhan Saya ({myMentoredClasses.length})
                            </button>
                            <button
                                onClick={() => setUstadzKelasFilter('semua')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    ustadzKelasFilter === 'semua' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Seluruh Kelas ({kelasList.length})
                            </button>
                        </div>
                    </div>

                    {/* Section 1: Kelas Tahfidz Binaan & Santrinya */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <i className="fas fa-users-class text-emerald-700"></i>
                            {ustadzKelasFilter === 'binaan' ? 'Kelas Tahfidz yang Anda Bina (Wali Kelas)' : 'Daftar Seluruh Kelas Pesantren'}
                        </h4>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {(ustadzKelasFilter === 'binaan' ? myMentoredClasses : kelasList).map(k => {
                                const students = getSantriForKelas(k);

                                return (
                                    <div key={k.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                    {k.tingkat}
                                                </span>
                                                <h5 className="font-bold text-gray-900 text-base mt-1">{k.namaKelas}</h5>
                                                <p className="text-xs text-gray-500">{k.ruangan} • {k.jadwalHalaqah}</p>
                                            </div>
                                            <span className="bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-xl text-xs border border-teal-200">
                                                {students.length} Santri
                                            </span>
                                        </div>

                                        {/* Daftar Santri Ringkas */}
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Santri Terdaftar di Kelas Ini:
                                                </span>
                                                <button
                                                    onClick={() => setViewSantriKelas(k)}
                                                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                                                >
                                                    Lihat Lengkap &rarr;
                                                </button>
                                            </div>

                                            {students.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-xl text-center">
                                                    Belum ada santri yang dialokasikan ke kelas ini.
                                                </p>
                                            ) : (
                                                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                                    {students.map(s => (
                                                        <div key={s.id} className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                                                            <div>
                                                                <span className="font-bold text-gray-800">{s.nama}</span>
                                                                <span className="text-[10px] text-gray-500 block">NIS: {s.nis} • {s.totalHafalanJuz} Juz Mutqin</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (onOpenSetoranForSantri) {
                                                                        onOpenSetoranForSantri(s.id);
                                                                    } else if (onNavigateTab) {
                                                                        onNavigateTab('setoran');
                                                                    }
                                                                }}
                                                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs transition"
                                                            >
                                                                Uji Tasmi'
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Jadwal & Mata Pelajaran yang Diampu */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <i className="fas fa-calendar-check text-blue-600"></i> Mata Pelajaran yang Anda Ampu Pekan Ini
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">Jadwal tatap muka halaqah kajian kitab &amp; tahsin ilmu tajwid</p>
                            </div>
                        </div>

                        {myTaughtMapel.length === 0 ? (
                            <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-xl text-center">
                                Tidak ada mata pelajaran yang tercatat diampu oleh Anda saat ini.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {myTaughtMapel.map(m => (
                                    <div key={m.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                                                    {m.kodeMapel}
                                                </span>
                                                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                    {m.hari}, {m.jamMulai} - {m.jamSelesai}
                                                </span>
                                            </div>
                                            <h5 className="font-bold text-gray-900 text-sm mt-1">{m.namaMapel}</h5>
                                            <p className="text-gray-600 text-xs mt-0.5">
                                                Kitab: <strong>{m.kitabRujukan}</strong>
                                            </p>
                                            <p className="text-gray-500 text-[11px] mt-1">
                                                Kelas: <span className="font-semibold text-gray-800">{m.namaKelas}</span> • Ruangan: {m.ruangan}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-gray-200 mt-3 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    setSelectedMapelForJournal(m);
                                                    setJournalBabPertemuan('');
                                                    setJournalCatatanUstadz('');
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                            >
                                                <i className="fas fa-edit"></i>
                                                <span>Catat Materi Pertemuan</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 3. TAMPILAN KHUSUS MODUL SANTRI (SANTRI TAHFIDZ)                           */}
            {/* ========================================================================= */}
            {isSantri && (
                <div className="space-y-6">
                    {/* Profil Kelas Santri */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
                            <div>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Kelas Tahfidz Saya
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-1">{myKelas?.namaKelas}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Tingkat: <strong>{myKelas?.tingkat}</strong> • Tahun Ajaran {myKelas?.tahunAjaran}
                                </p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">Rekan Sekelas</span>
                                <span className="text-2xl font-bold text-emerald-800">{myClassmates.length}</span>
                                <span className="text-xs text-gray-600 block">Santri Aktif</span>
                            </div>
                        </div>

                        {/* Detail Kelas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4 text-xs">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Wali Kelas / Musyrif</span>
                                <span className="font-bold text-gray-800 mt-0.5 block">{myKelas?.waliKelas}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Ruang Belajar</span>
                                <span className="font-bold text-gray-800 mt-0.5 block">{myKelas?.ruangan}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Jadwal Sesi Halaqah</span>
                                <span className="font-bold text-gray-800 mt-0.5 block">{myKelas?.jadwalHalaqah}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Target Hafalan Minimal</span>
                                <span className="font-bold text-emerald-800 mt-0.5 block">{myKelas?.targetJuzMinimal} Juz Sah</span>
                            </div>
                        </div>

                        {/* Daftar Rekan Sekelas (Fastabiqul Khairat) */}
                        <div className="mt-5">
                            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                <i className="fas fa-user-friends text-emerald-700"></i> Rekan-Rekan Santri di Kelas Saya ({myClassmates.length})
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {myClassmates.map(s => {
                                    const isMe = s.id === currentSantri?.id;
                                    return (
                                        <div 
                                            key={s.id} 
                                            className={`p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                                                isMe ? 'bg-emerald-50 border-emerald-300 shadow-2xs' : 'bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                    isMe ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                    {s.nama.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                        <span>{s.nama}</span>
                                                        {isMe && <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">Saya</span>}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500">NIS: {s.nis}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-emerald-800">{s.totalHafalanJuz} Juz</span>
                                                <span className="text-[9px] text-gray-400 block">{s.status}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Jadwal Mata Pelajaran Santri */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <i className="fas fa-book-reader text-emerald-700"></i> Jadwal Mata Pelajaran Tahfidz Saya
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">Mata pelajaran dan kitab yang wajib diikuti santri kelas {myKelas?.namaKelas}</p>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <i className="fas fa-print"></i> Cetak Jadwal
                            </button>
                        </div>

                        {myMapelList.length === 0 ? (
                            <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                                Belum ada mata pelajaran yang dijadwalkan untuk kelas ini.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myMapelList.map(m => (
                                    <div key={m.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-xs flex flex-col justify-between hover:border-emerald-300 transition">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                                    {m.kodeMapel}
                                                </span>
                                                <span className="font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-[11px]">
                                                    {m.hari}, {m.jamMulai} - {m.jamSelesai}
                                                </span>
                                            </div>

                                            <h5 className="font-bold text-gray-900 text-sm">{m.namaMapel}</h5>
                                            <p className="text-emerald-900 font-semibold text-xs mt-1">
                                                <i className="fas fa-book mr-1.5 text-emerald-700"></i> Kitab: {m.kitabRujukan}
                                            </p>

                                            <div className="my-2.5 space-y-1 text-gray-600 text-[11px]">
                                                <div><i className="fas fa-chalkboard-teacher w-4 text-emerald-700"></i> Pengampu: <strong>{m.ustadzPengampu}</strong></div>
                                                <div><i className="fas fa-map-marker-alt w-4 text-emerald-700"></i> Tempat: {m.ruangan}</div>
                                            </div>

                                            {m.silabus && m.silabus.length > 0 && (
                                                <div className="mt-2.5 pt-2 border-t border-gray-200/80">
                                                    <span className="font-bold text-[10px] uppercase text-gray-500 block mb-1">
                                                        Pokok Bahasan / Silabus:
                                                    </span>
                                                    <div className="space-y-0.5">
                                                        {m.silabus.map((s, sIdx) => (
                                                            <div key={sIdx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                                                                <i className="fas fa-check text-[9px] text-emerald-600 mt-1"></i>
                                                                <span>{s}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {m.deskripsi && (
                                            <p className="text-[11px] text-gray-500 italic mt-3 pt-2 border-t border-gray-200">
                                                "{m.deskripsi}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODALS CRUD KELAS TAHFIDZ & MATA PELAJARAN                                */}
            {/* ========================================================================= */}

            {/* MODAL 1: BUKA KELAS BARU (ADMIN) */}
            {isAddKelasOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-school text-emerald-700"></i> Buka Kelas Tahfidz Baru
                            </h3>
                            <button 
                                onClick={() => setIsAddKelasOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewKelas} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Kelas Tahfidz</label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: Tahfidz Ula B (Dasar Khusus)"
                                    value={formNamaKelas}
                                    onChange={(e) => setFormNamaKelas(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tingkat Jenjang</label>
                                    <select
                                        value={formTingkat}
                                        onChange={(e) => setFormTingkat(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Ula / I'dad">Ula / I'dad (Dasar)</option>
                                        <option value="Wustha">Wustha (Menengah)</option>
                                        <option value="Ulya">Ulya (Lanjutan)</option>
                                        <option value="Takhassus 30 Juz">Takhassus 30 Juz</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kapasitas Maksimal (Santri)</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={formKapasitas}
                                        onChange={(e) => setFormKapasitas(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Ustadz Wali Kelas / Musyrif Pembina</label>
                                <input 
                                    type="text"
                                    value={formWaliKelas}
                                    onChange={(e) => setFormWaliKelas(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ruangan Belajar</label>
                                    <input 
                                        type="text"
                                        value={formRuangan}
                                        onChange={(e) => setFormRuangan(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Target Minimal (Juz)</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={formTargetJuz}
                                        onChange={(e) => setFormTargetJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Jadwal Sesi Halaqah</label>
                                <input 
                                    type="text"
                                    value={formJadwalHalaqah}
                                    onChange={(e) => setFormJadwalHalaqah(e.target.value)}
                                    placeholder="Contoh: Ba'da Subuh & Ba'da Ashar"
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Keterangan / Fokus Pembelajaran</label>
                                <textarea 
                                    rows={2}
                                    value={formKeteranganKelas}
                                    onChange={(e) => setFormKeteranganKelas(e.target.value)}
                                    placeholder="Fokus penguatan tajwid, target kelulusan..."
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddKelasOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Buka Kelas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EDIT KELAS TAHFIDZ (ADMIN) */}
            {isEditKelasOpen && editKelasTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-edit text-emerald-700"></i> Edit Data Kelas Tahfidz
                            </h3>
                            <button 
                                onClick={() => setIsEditKelasOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateKelas} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Kelas Tahfidz</label>
                                <input 
                                    type="text"
                                    value={formNamaKelas}
                                    onChange={(e) => setFormNamaKelas(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tingkat Jenjang</label>
                                    <select
                                        value={formTingkat}
                                        onChange={(e) => setFormTingkat(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Ula / I'dad">Ula / I'dad (Dasar)</option>
                                        <option value="Wustha">Wustha (Menengah)</option>
                                        <option value="Ulya">Ulya (Lanjutan)</option>
                                        <option value="Takhassus 30 Juz">Takhassus 30 Juz</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kapasitas (Santri)</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={formKapasitas}
                                        onChange={(e) => setFormKapasitas(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Wali Kelas / Musyrif</label>
                                <input 
                                    type="text"
                                    value={formWaliKelas}
                                    onChange={(e) => setFormWaliKelas(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ruangan</label>
                                    <input 
                                        type="text"
                                        value={formRuangan}
                                        onChange={(e) => setFormRuangan(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Target Minimal (Juz)</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={formTargetJuz}
                                        onChange={(e) => setFormTargetJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Jadwal Sesi Halaqah</label>
                                <input 
                                    type="text"
                                    value={formJadwalHalaqah}
                                    onChange={(e) => setFormJadwalHalaqah(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Keterangan Kelas</label>
                                <textarea 
                                    rows={2}
                                    value={formKeteranganKelas}
                                    onChange={(e) => setFormKeteranganKelas(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditKelasOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: LIHAT SANTRI DALAM KELAS (ADMIN / USTADZ) */}
            {viewSantriKelas && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        <div className="flex justify-between items-start pb-3 border-b border-gray-200 mb-4">
                            <div>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    {viewSantriKelas.tingkat}
                                </span>
                                <h3 className="font-bold text-gray-900 text-base mt-1">
                                    Daftar Santri: {viewSantriKelas.namaKelas}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Wali Kelas: <strong>{viewSantriKelas.waliKelas}</strong> • Kapasitas: {viewSantriKelas.kapasitas} Santri
                                </p>
                            </div>
                            <button 
                                onClick={() => setViewSantriKelas(null)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {getSantriForKelas(viewSantriKelas).length === 0 ? (
                            <div className="bg-gray-50 p-6 rounded-2xl text-center text-gray-500 text-xs">
                                <i className="fas fa-user-slash text-2xl text-gray-400 mb-2"></i>
                                <p>Belum ada santri yang terdaftar di kelas ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {getSantriForKelas(viewSantriKelas).map((s, sIdx) => (
                                    <div key={s.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs flex justify-between items-center hover:bg-gray-100 transition">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 text-center font-bold text-gray-400">{sIdx + 1}</span>
                                            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                                                {s.nama.charAt(0)}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900">{s.nama}</h5>
                                                <span className="text-[10px] text-gray-500">NIS: {s.nis} • Halaqah: {s.halaqah}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                                                {s.totalHafalanJuz} Juz Mutqin
                                            </span>
                                            <span className="text-[10px] text-gray-500 block mt-0.5">{s.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                            <button
                                onClick={() => setViewSantriKelas(null)}
                                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: HAPUS KELAS KONFIRMASI */}
            {deleteKelasTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-trash-alt text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">
                            Hapus Kelas Tahfidz
                        </h3>
                        <p className="text-center text-xs text-gray-600 leading-relaxed mb-4">
                            Apakah Anda yakin ingin menghapus <strong>{deleteKelasTarget.namaKelas}</strong>?
                            {getSantriForKelas(deleteKelasTarget).length > 0 && (
                                <span className="block text-red-600 font-bold mt-2">
                                    Peringatan: Terdapat {getSantriForKelas(deleteKelasTarget).length} santri yang masih terdaftar di kelas ini!
                                </span>
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteKelasTarget(null)}
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteKelas}
                                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                Ya, Hapus Kelas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 5: TAMBAH MATA PELAJARAN (ADMIN) */}
            {isAddMapelOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-book-medical text-emerald-700"></i> Tambah Mata Pelajaran Baru
                            </h3>
                            <button 
                                onClick={() => setIsAddMapelOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewMapel} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kode Mapel</label>
                                    <input 
                                        type="text"
                                        placeholder="TJW-102"
                                        value={formKodeMapel}
                                        onChange={(e) => setFormKodeMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block font-bold text-gray-700 mb-1">Nama Mata Pelajaran</label>
                                    <input 
                                        type="text"
                                        placeholder="Contoh: Tahsin & Fashohah Al-Lisan"
                                        value={formNamaMapel}
                                        onChange={(e) => setFormNamaMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Kitab Rujukan / Sumber Materi</label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: Matan Manzhumah Tuhfatul Athfal"
                                    value={formKitabRujukan}
                                    onChange={(e) => setFormKitabRujukan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ustadz Pengampu</label>
                                    <input 
                                        type="text"
                                        value={formUstadzPengampu}
                                        onChange={(e) => setFormUstadzPengampu(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Alokasi Kelas Sasaran</label>
                                    <select
                                        value={formMapelKelasId}
                                        onChange={(e) => setFormMapelKelasId(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="all">Semua Kelas Tahfidz (Gabungan)</option>
                                        {kelasList.map(k => (
                                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Hari</label>
                                    <select
                                        value={formHariMapel}
                                        onChange={(e) => setFormHariMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Senin">Senin</option>
                                        <option value="Selasa">Selasa</option>
                                        <option value="Rabu">Rabu</option>
                                        <option value="Kamis">Kamis</option>
                                        <option value="Jum'at">Jum'at</option>
                                        <option value="Sabtu">Sabtu</option>
                                        <option value="Ahad">Ahad</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jam Mulai</label>
                                    <input 
                                        type="time"
                                        value={formJamMulai}
                                        onChange={(e) => setFormJamMulai(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jam Selesai</label>
                                    <input 
                                        type="time"
                                        value={formJamSelesai}
                                        onChange={(e) => setFormJamSelesai(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ruangan</label>
                                    <input 
                                        type="text"
                                        value={formRuanganMapel}
                                        onChange={(e) => setFormRuanganMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Bobot SKS / Jam Pelajaran</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="6"
                                        value={formBobotSks}
                                        onChange={(e) => setFormBobotSks(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pokok Bahasan / Silabus (1 baris per bab)</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Bab 1: Makharijul Huruf&#10;Bab 2: Sifatul Huruf&#10;Bab 3: Ahkamul Mad"
                                    value={formSilabusText}
                                    onChange={(e) => setFormSilabusText(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddMapelOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Mapel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: EDIT MATA PELAJARAN (ADMIN) */}
            {isEditMapelOpen && editMapelTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up border border-gray-100">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-edit text-emerald-700"></i> Edit Mata Pelajaran
                            </h3>
                            <button 
                                onClick={() => setIsEditMapelOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateMapel} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kode Mapel</label>
                                    <input 
                                        type="text"
                                        value={formKodeMapel}
                                        onChange={(e) => setFormKodeMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block font-bold text-gray-700 mb-1">Nama Mata Pelajaran</label>
                                    <input 
                                        type="text"
                                        value={formNamaMapel}
                                        onChange={(e) => setFormNamaMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Kitab Rujukan</label>
                                <input 
                                    type="text"
                                    value={formKitabRujukan}
                                    onChange={(e) => setFormKitabRujukan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ustadz Pengampu</label>
                                    <input 
                                        type="text"
                                        value={formUstadzPengampu}
                                        onChange={(e) => setFormUstadzPengampu(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Alokasi Kelas</label>
                                    <select
                                        value={formMapelKelasId}
                                        onChange={(e) => setFormMapelKelasId(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="all">Semua Kelas Tahfidz (Gabungan)</option>
                                        {kelasList.map(k => (
                                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Hari</label>
                                    <select
                                        value={formHariMapel}
                                        onChange={(e) => setFormHariMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Senin">Senin</option>
                                        <option value="Selasa">Selasa</option>
                                        <option value="Rabu">Rabu</option>
                                        <option value="Kamis">Kamis</option>
                                        <option value="Jum'at">Jum'at</option>
                                        <option value="Sabtu">Sabtu</option>
                                        <option value="Ahad">Ahad</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jam Mulai</label>
                                    <input 
                                        type="time"
                                        value={formJamMulai}
                                        onChange={(e) => setFormJamMulai(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jam Selesai</label>
                                    <input 
                                        type="time"
                                        value={formJamSelesai}
                                        onChange={(e) => setFormJamSelesai(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ruangan</label>
                                    <input 
                                        type="text"
                                        value={formRuanganMapel}
                                        onChange={(e) => setFormRuanganMapel(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Bobot SKS / Jam Pelajaran</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="6"
                                        value={formBobotSks}
                                        onChange={(e) => setFormBobotSks(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pokok Bahasan / Silabus (1 baris per bab)</label>
                                <textarea 
                                    rows={3}
                                    value={formSilabusText}
                                    onChange={(e) => setFormSilabusText(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditMapelOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: HAPUS MAPEL KONFIRMASI */}
            {deleteMapelTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-trash-alt text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">
                            Hapus Mata Pelajaran
                        </h3>
                        <p className="text-center text-xs text-gray-600 leading-relaxed mb-5">
                            Apakah Anda yakin ingin menghapus mata pelajaran <strong>{deleteMapelTarget.namaMapel}</strong> ({deleteMapelTarget.kodeMapel})?
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteMapelTarget(null)}
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteMapel}
                                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                Ya, Hapus Mapel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 8: CATAT MATERI PERTEMUAN (USTADZ JOURNAL) */}
            {selectedMapelForJournal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-chalkboard text-blue-600"></i> Catatan Agenda Pertemuan
                            </h3>
                            <button 
                                onClick={() => setSelectedMapelForJournal(null)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs mb-3 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mapel:</span>
                                <strong className="text-blue-900">{selectedMapelForJournal.namaMapel}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kitab:</span>
                                <span className="text-gray-700 font-medium">{selectedMapelForJournal.kitabRujukan}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kelas:</span>
                                <span className="text-gray-700 font-medium">{selectedMapelForJournal.namaKelas}</span>
                            </div>
                        </div>

                        {journalSuccessMessage && (
                            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs mb-3 border border-emerald-200 flex items-center gap-2">
                                <i className="fas fa-check-circle text-emerald-600"></i>
                                <span>{journalSuccessMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveTeacherJournal} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">
                                    Bab / Bait yang Diajarkan Hari Ini
                                </label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: Bab Makharijul Lisan (Bait 15-22)"
                                    value={journalBabPertemuan}
                                    onChange={(e) => setJournalBabPertemuan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">
                                    Catatan Perkembangan &amp; Tugas Muroja'ah untuk Santri
                                </label>
                                <textarea 
                                    rows={3}
                                    placeholder="Misal: Seluruh santri wajib menghafalkan bait 15-22 dan mempraktikkan makhraj huruf lam, nun, ro..."
                                    value={journalCatatanUstadz}
                                    onChange={(e) => setJournalCatatanUstadz(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setSelectedMapelForJournal(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Agenda &amp; Siarkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
