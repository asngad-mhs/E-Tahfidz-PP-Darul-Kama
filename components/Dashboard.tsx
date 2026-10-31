import React, { useState, useEffect } from 'react';
import { User, Santri, SetoranRecord, JuzStatusType, JuzProgressRecord, JurnalBelajarSantri, RencanaSetoran, KelasTahfidz, MataPelajaranTahfidz } from '../types';
import { INITIAL_SANTRI, INITIAL_SETORAN, INITIAL_JURNAL_BELAJAR, INITIAL_RENCANA_SETORAN, INITIAL_KELAS_TAHFIDZ, INITIAL_MAPEL_TAHFIDZ, GOOGLE_SCRIPT_SAMPLE_CODE, QURAN_SURAHS, JUZ_METADATA, createDefaultJuzProgress } from '../mockData';
import { callAPI } from '../services/apiService';
import { Button } from './Button';
import { 
    seedInitialFirestoreData, 
    subscribeSantri, 
    subscribeSetoran, 
    subscribeJurnal, 
    subscribeRencana, 
    subscribeKelas,
    subscribeMapel,
    syncSantriDoc, 
    syncSetoranDoc, 
    syncJurnalDoc, 
    syncRencanaDoc,
    deleteSantriDoc,
    deleteSetoranDoc,
    deleteJurnalDoc,
    deleteRencanaDoc,
    testConnection
} from '../services/firebaseService';
import { KelasMapelModule } from './KelasMapelModule';
import { RaportSyahadahModal } from './RaportSyahadahModal';
import { TahfidzToolsModal } from './TahfidzToolsModal';

interface DashboardProps {
    user: User | null;
    onLogout: () => void;
    apiUrl?: string;
    setApiUrl?: (url: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, apiUrl = '', setApiUrl }) => {
    // Dynamic Role Switcher (mempermudah pengujian & validasi modul antar peran)
    const [currentRoleOverride, setCurrentRoleOverride] = useState<'admin' | 'ustadz' | 'santri' | null>(null);
    const effectiveRole = currentRoleOverride || (user?.role as 'admin' | 'ustadz' | 'santri') || 'santri';
    const isAdmin = effectiveRole === 'admin';
    const isUstadz = effectiveRole === 'ustadz';
    const isSantri = effectiveRole === 'santri';

    type TabType = 'dashboard' | 'jurnal' | 'rencana' | 'hafalan' | 'setoran' | 'santri' | 'halaqah' | 'pengaturan' | 'kelas_mapel';
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Persisted Santri List
    const [santriList, setSantriList] = useState<Santri[]>(() => {
        const saved = localStorage.getItem('darul_kamal_santri_list') || localStorage.getItem('darul_karomah_santri_list');
        if (saved) {
            try { 
                const parsed: Santri[] = JSON.parse(saved);
                return parsed.map(s => ({
                    ...s,
                    juzProgress: s.juzProgress || createDefaultJuzProgress(s.totalHafalanJuz || 0)
                }));
            } catch { 
                return INITIAL_SANTRI; 
            }
        }
        return INITIAL_SANTRI;
    });

    // Persisted Official Setoran Records (from Musyrif)
    const [setoranList, setSetoranList] = useState<SetoranRecord[]>(() => {
        const saved = localStorage.getItem('darul_kamal_setoran_list') || localStorage.getItem('darul_karomah_setoran_list');
        if (saved) {
            try { return JSON.parse(saved); } catch { return INITIAL_SETORAN; }
        }
        return INITIAL_SETORAN;
    });

    // Persisted Jurnal Belajar Santri (Self-study logs)
    const [jurnalList, setJurnalList] = useState<JurnalBelajarSantri[]>(() => {
        const saved = localStorage.getItem('darul_kamal_jurnal_list') || localStorage.getItem('darul_karomah_jurnal_list');
        if (saved) {
            try { return JSON.parse(saved); } catch { return INITIAL_JURNAL_BELAJAR; }
        }
        return INITIAL_JURNAL_BELAJAR;
    });

    // Persisted Rencana Setoran (Planned submissions to ustadz)
    const [rencanaList, setRencanaList] = useState<RencanaSetoran[]>(() => {
        const saved = localStorage.getItem('darul_kamal_rencana_list') || localStorage.getItem('darul_karomah_rencana_list');
        if (saved) {
            try { return JSON.parse(saved); } catch { return INITIAL_RENCANA_SETORAN; }
        }
        return INITIAL_RENCANA_SETORAN;
    });

    useEffect(() => {
        localStorage.setItem('darul_kamal_santri_list', JSON.stringify(santriList));
    }, [santriList]);

    useEffect(() => {
        localStorage.setItem('darul_kamal_setoran_list', JSON.stringify(setoranList));
    }, [setoranList]);

    useEffect(() => {
        localStorage.setItem('darul_kamal_jurnal_list', JSON.stringify(jurnalList));
    }, [jurnalList]);

    useEffect(() => {
        localStorage.setItem('darul_kamal_rencana_list', JSON.stringify(rencanaList));
    }, [rencanaList]);

    // Persisted Kelas Tahfidz List
    const [kelasList, setKelasList] = useState<KelasTahfidz[]>(() => {
        const saved = localStorage.getItem('darul_kamal_kelas_list');
        if (saved) {
            try { return JSON.parse(saved); } catch { return INITIAL_KELAS_TAHFIDZ; }
        }
        return INITIAL_KELAS_TAHFIDZ;
    });

    // Persisted Mata Pelajaran Tahfidz List
    const [mapelList, setMapelList] = useState<MataPelajaranTahfidz[]>(() => {
        const saved = localStorage.getItem('darul_kamal_mapel_list');
        if (saved) {
            try { return JSON.parse(saved); } catch { return INITIAL_MAPEL_TAHFIDZ; }
        }
        return INITIAL_MAPEL_TAHFIDZ;
    });

    useEffect(() => {
        localStorage.setItem('darul_kamal_kelas_list', JSON.stringify(kelasList));
    }, [kelasList]);

    useEffect(() => {
        localStorage.setItem('darul_kamal_mapel_list', JSON.stringify(mapelList));
    }, [mapelList]);

    // Firebase Firestore Real-Time Sync
    const [firebaseConnected, setFirebaseConnected] = useState(false);

    useEffect(() => {
        // Auto-seed Firestore on initial launch if collections are empty
        seedInitialFirestoreData();
        testConnection().then(setFirebaseConnected);

        // Real-time synchronization listeners
        const unsubSantri = subscribeSantri((remoteSantri) => {
            if (remoteSantri && remoteSantri.length > 0) {
                setSantriList(remoteSantri);
            }
        });

        const unsubSetoran = subscribeSetoran((remoteSetoran) => {
            if (remoteSetoran && remoteSetoran.length > 0) {
                setSetoranList(remoteSetoran);
            }
        });

        const unsubJurnal = subscribeJurnal((remoteJurnal) => {
            if (remoteJurnal && remoteJurnal.length > 0) {
                setJurnalList(remoteJurnal);
            }
        });

        const unsubRencana = subscribeRencana((remoteRencana) => {
            if (remoteRencana && remoteRencana.length > 0) {
                setRencanaList(remoteRencana);
            }
        });

        const unsubKelas = subscribeKelas((remoteKelas) => {
            if (remoteKelas && remoteKelas.length > 0) {
                setKelasList(remoteKelas);
            }
        });

        const unsubMapel = subscribeMapel((remoteMapel) => {
            if (remoteMapel && remoteMapel.length > 0) {
                setMapelList(remoteMapel);
            }
        });

        return () => {
            unsubSantri();
            unsubSetoran();
            unsubJurnal();
            unsubRencana();
            unsubKelas();
            unsubMapel();
        };
    }, []);

    // Halaqah to Musyrif Default Mapping
    const HALAQAH_MUSYRIF_MAP: Record<string, string> = {
        'Halaqah Abu Bakar Ash-Shiddiq': 'Ustadz Abdullah Mukhtar, S.Pd.I',
        'Halaqah Umar bin Khattab': 'Ustadz Muhammad Yusuf, Lc.',
        'Halaqah Utsman bin Affan': 'Ustadz Ahmad Zaki, Al-Hafidz',
        'Halaqah Ali bin Abi Thalib': 'Ustadz Ridwan Hakim, M.Pd.'
    };

    // Simulated Santri ID (for Santri role switching & inspection)
    const [simulatedSantriId, setSimulatedSantriId] = useState<string>('');

    // Active Santri Object (for Santri role or selected in Admin view)
    const currentSantri: Santri = (isSantri
        ? (simulatedSantriId ? santriList.find(s => s.id === simulatedSantriId) : null) ||
          santriList.find(s => 
            (user?.id && (s.id === user.id || s.nis === user.id || s.nis.toLowerCase() === user.id.toLowerCase())) ||
            (user?.nama && (s.nama.toLowerCase() === user.nama.toLowerCase() || s.nama.toLowerCase().includes(user.nama.toLowerCase())))
          )
        : null) || santriList[0] || INITIAL_SANTRI[0];

    const [selectedJuzSantriId, setSelectedJuzSantriId] = useState<string>(() => currentSantri?.id || 's-1');
    const activeJuzSantri = santriList.find(s => s.id === selectedJuzSantriId) || currentSantri || santriList[0] || INITIAL_SANTRI[0];

    useEffect(() => {
        if (isSantri && currentSantri?.id) {
            setSelectedJuzSantriId(currentSantri.id);
        }
    }, [isSantri, currentSantri?.id]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState<'Semua' | 'Ziyadah' | "Muroja'ah">('Semua');
    const [filterSantriId, setFilterSantriId] = useState<string>('Semua');

    // 30 Juz Module States
    const [juzFilterStatus, setJuzFilterStatus] = useState<'Semua' | JuzStatusType>('Semua');
    const [juzViewMode, setJuzViewMode] = useState<'grid' | 'table'>('grid');
    const [activeJuzModal, setActiveJuzModal] = useState<number | null>(null);
    const [modalJuzStatus, setModalJuzStatus] = useState<JuzStatusType>('Mutqin');
    const [modalJuzNilai, setModalJuzNilai] = useState<string>('A (Mumtaz)');
    const [modalJuzTanggal, setModalJuzTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
    const [modalJuzPenguji, setModalJuzPenguji] = useState<string>(user?.nama || 'Ustadz Abdullah');
    const [modalJuzCatatan, setModalJuzCatatan] = useState<string>('');

    // Modal Input Jurnal Belajar Santri (Self-Study Log)
    const [isAddJurnalOpen, setIsAddJurnalOpen] = useState(false);
    const [jurnalKegiatan, setJurnalKegiatan] = useState<'Ziyadah Mandiri' | "Muroja'ah Mandiri" | 'Talaqqi Simakan' | 'Kajian Tajwid & Makhorij'>('Ziyadah Mandiri');
    const [jurnalSurahNomor, setJurnalSurahNomor] = useState<number>(7);
    const [jurnalAyatAwal, setJurnalAyatAwal] = useState('46');
    const [jurnalAyatAkhir, setJurnalAyatAkhir] = useState('60');
    const [jurnalJuz, setJurnalJuz] = useState('8');
    const [jurnalDurasi, setJurnalDurasi] = useState('40');
    const [jurnalKelancaran, setJurnalKelancaran] = useState<'Sangat Lancar' | 'Cukup Lancar' | 'Masih Terbata' | 'Butuh Pendampingan'>('Sangat Lancar');
    const [jurnalCatatanSulit, setJurnalCatatanSulit] = useState('');

    // Modal Bimbingan & Paraf Musyrif untuk Jurnal Santri
    const [isBimbinganJurnalOpen, setIsBimbinganJurnalOpen] = useState(false);
    const [bimbinganTargetJurnal, setBimbinganTargetJurnal] = useState<JurnalBelajarSantri | null>(null);
    const [bimbinganText, setBimbinganText] = useState('');

    // Modal Input Rencana Setoran (Plan submission)
    const [isAddRencanaOpen, setIsAddRencanaOpen] = useState(false);
    const [rencanaTanggal, setRencanaTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
    const [rencanaWaktu, setRencanaWaktu] = useState<'Ba\'da Subuh' | 'Ba\'da Ashar' | 'Ba\'da Maghrib' | 'Ba\'da Isya'>('Ba\'da Subuh');
    const [rencanaJenis, setRencanaJenis] = useState<'Ziyadah' | "Muroja'ah">('Ziyadah');
    const [rencanaSurahNomor, setRencanaSurahNomor] = useState<number>(7);
    const [rencanaAyatAwal, setRencanaAyatAwal] = useState('46');
    const [rencanaAyatAkhir, setRencanaAyatAkhir] = useState('65');
    const [rencanaJuz, setRencanaJuz] = useState('8');
    const [rencanaCatatan, setRencanaCatatan] = useState('');

    // Modal Input Setoran Baru (Official Musyrif Input) & Linked Rencana
    const [isAddSetoranOpen, setIsAddSetoranOpen] = useState(false);
    const [linkedRencanaId, setLinkedRencanaId] = useState<string | null>(null);
    const [selectedSantriId, setSelectedSantriId] = useState(santriList[0]?.id || 's-1');
    const [formJenis, setFormJenis] = useState<'Ziyadah' | "Muroja'ah">('Ziyadah');
    const [selectedSurahNomor, setSelectedSurahNomor] = useState<number>(1);
    const [formAyatAwal, setFormAyatAwal] = useState('1');
    const [formAyatAkhir, setFormAyatAkhir] = useState('7');
    const [formJuz, setFormJuz] = useState('1');
    const [formNilai, setFormNilai] = useState<'A (Mumtaz)' | 'B (Jayyid Jiddan)' | 'C (Jayyid)' | 'D (Maqbul)'>('A (Mumtaz)');
    const [formCatatan, setFormCatatan] = useState('');

    // Modal Tambah Santri Baru (Admin)
    const [isAddSantriOpen, setIsAddSantriOpen] = useState(false);
    const [newNis, setNewNis] = useState('');
    const [newNama, setNewNama] = useState('');
    const [newKelas, setNewKelas] = useState('Kelas X - Tahfidz Wustho');
    const [newHalaqah, setNewHalaqah] = useState('Halaqah Abu Bakar Ash-Shiddiq');
    const [newMusyrif, setNewMusyrif] = useState(user?.nama || 'Ustadz Abdullah');
    const [newTotalJuz, setNewTotalJuz] = useState('0');
    const [newStatus, setNewStatus] = useState<'Aktif' | 'Izin' | 'Mutakharij'>('Aktif');

    // Filter Status Santri (Admin/Ustadz)
    const [filterSantriStatus, setFilterSantriStatus] = useState<'Semua' | 'Aktif' | 'Izin' | 'Mutakharij'>('Semua');

    // Admin: Edit & Delete Santri
    const [isEditSantriOpen, setIsEditSantriOpen] = useState(false);
    const [editSantriId, setEditSantriId] = useState('');
    const [editNis, setEditNis] = useState('');
    const [editNama, setEditNama] = useState('');
    const [editKelas, setEditKelas] = useState('');
    const [editHalaqah, setEditHalaqah] = useState('');
    const [editMusyrif, setEditMusyrif] = useState('');
    const [editStatus, setEditStatus] = useState<'Aktif' | 'Izin' | 'Mutakharij'>('Aktif');
    const [editTotalJuz, setEditTotalJuz] = useState('0');
    const [editTargetKhatam, setEditTargetKhatam] = useState('');
    const [deleteSantriTarget, setDeleteSantriTarget] = useState<Santri | null>(null);

    // Ustadz: Edit & Delete Setoran
    const [isEditSetoranOpen, setIsEditSetoranOpen] = useState(false);
    const [editSetoranId, setEditSetoranId] = useState('');
    const [editSetoranSantriId, setEditSetoranSantriId] = useState('');
    const [editSetoranJenis, setEditSetoranJenis] = useState<'Ziyadah' | "Muroja'ah">('Ziyadah');
    const [editSetoranSurahNomor, setEditSetoranSurahNomor] = useState<number>(1);
    const [editSetoranAyatAwal, setEditSetoranAyatAwal] = useState('1');
    const [editSetoranAyatAkhir, setEditSetoranAyatAkhir] = useState('7');
    const [editSetoranJuz, setEditSetoranJuz] = useState('1');
    const [editSetoranNilai, setEditSetoranNilai] = useState<'A (Mumtaz)' | 'B (Jayyid Jiddan)' | 'C (Jayyid)' | 'D (Maqbul)'>('A (Mumtaz)');
    const [editSetoranCatatan, setEditSetoranCatatan] = useState('');
    const [deleteSetoranTarget, setDeleteSetoranTarget] = useState<SetoranRecord | null>(null);

    // Santri: Edit & Delete Jurnal Belajar Mandiri
    const [isEditJurnalOpen, setIsEditJurnalOpen] = useState(false);
    const [editJurnalId, setEditJurnalId] = useState('');
    const [editJurnalKegiatan, setEditJurnalKegiatan] = useState<'Ziyadah Mandiri' | "Muroja'ah Mandiri" | 'Talaqqi Simakan' | 'Kajian Tajwid & Makhorij'>('Ziyadah Mandiri');
    const [editJurnalSurahNomor, setEditJurnalSurahNomor] = useState<number>(1);
    const [editJurnalAyatAwal, setEditJurnalAyatAwal] = useState('1');
    const [editJurnalAyatAkhir, setEditJurnalAyatAkhir] = useState('10');
    const [editJurnalJuz, setEditJurnalJuz] = useState('1');
    const [editJurnalDurasi, setEditJurnalDurasi] = useState('30');
    const [editJurnalKelancaran, setEditJurnalKelancaran] = useState<'Sangat Lancar' | 'Cukup Lancar' | 'Masih Terbata' | 'Butuh Pendampingan'>('Sangat Lancar');
    const [editJurnalCatatanSulit, setEditJurnalCatatanSulit] = useState('');
    const [deleteJurnalTarget, setDeleteJurnalTarget] = useState<JurnalBelajarSantri | null>(null);

    // Santri: Edit & Delete Rencana Setoran
    const [isEditRencanaOpen, setIsEditRencanaOpen] = useState(false);
    const [editRencanaId, setEditRencanaId] = useState('');
    const [editRencanaTanggal, setEditRencanaTanggal] = useState('');
    const [editRencanaWaktu, setEditRencanaWaktu] = useState<'Ba\'da Subuh' | 'Ba\'da Ashar' | 'Ba\'da Maghrib' | 'Ba\'da Isya'>('Ba\'da Subuh');
    const [editRencanaJenis, setEditRencanaJenis] = useState<'Ziyadah' | "Muroja'ah">('Ziyadah');
    const [editRencanaSurahNomor, setEditRencanaSurahNomor] = useState<number>(1);
    const [editRencanaAyatAwal, setEditRencanaAyatAwal] = useState('1');
    const [editRencanaAyatAkhir, setEditRencanaAyatAkhir] = useState('20');
    const [editRencanaJuz, setEditRencanaJuz] = useState('1');
    const [editRencanaCatatan, setEditRencanaCatatan] = useState('');
    const [deleteRencanaTarget, setDeleteRencanaTarget] = useState<RencanaSetoran | null>(null);

    // Monitoring filters for Ustadz & Admin in Jurnal & Rencana
    const [jurnalFilterSantriId, setJurnalFilterSantriId] = useState<string>('Semua');
    const [rencanaFilterSantriId, setRencanaFilterSantriId] = useState<string>('Semua');
    const [rencanaFilterStatus, setRencanaFilterStatus] = useState<string>('Semua');

    // Modal Bookmark Update
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [bmSurahNomor, setBmSurahNomor] = useState<number>(7);
    const [bmAyat, setBmAyat] = useState('50');

    // Backend URL settings
    const [inputUrl, setInputUrl] = useState(apiUrl);
    const [urlSavedMessage, setUrlSavedMessage] = useState('');
    const [testConnectionStatus, setTestConnectionStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

    // Modal Reset Data Confirmation
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetSuccessMessage, setResetSuccessMessage] = useState('');

    const handleExecuteReset = () => {
        setSantriList(INITIAL_SANTRI);
        setSetoranList(INITIAL_SETORAN);
        setJurnalList(INITIAL_JURNAL_BELAJAR);
        setRencanaList(INITIAL_RENCANA_SETORAN);
        setKelasList(INITIAL_KELAS_TAHFIDZ);
        setMapelList(INITIAL_MAPEL_TAHFIDZ);
        localStorage.removeItem('darul_kamal_santri_list');
        localStorage.removeItem('darul_kamal_setoran_list');
        localStorage.removeItem('darul_kamal_jurnal_list');
        localStorage.removeItem('darul_kamal_rencana_list');
        localStorage.removeItem('darul_kamal_kelas_list');
        localStorage.removeItem('darul_kamal_mapel_list');
        localStorage.removeItem('darul_karomah_santri_list');
        localStorage.removeItem('darul_karomah_setoran_list');
        localStorage.removeItem('darul_karomah_jurnal_list');
        localStorage.removeItem('darul_karomah_rencana_list');
        setIsResetModalOpen(false);
        setResetSuccessMessage('Seluruh data santri, setoran, jurnal belajar, kelas tahfidz, mata pelajaran, dan peta 30 juz berhasil dikembalikan ke bawaan.');
        setTimeout(() => setResetSuccessMessage(''), 4000);
    };

    // Modal Raport & Syahadah Tahfidz
    const [isRaportModalOpen, setIsRaportModalOpen] = useState(false);
    const [raportTargetSantri, setRaportTargetSantri] = useState<Santri | null>(null);

    const handleOpenRaport = (santri: Santri) => {
        setRaportTargetSantri(santri);
        setIsRaportModalOpen(true);
    };

    // Modal Utilitas Cerdas (Kalkulator Target Khatam, Audio Murattal, Backup/Restore)
    const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
    const [toolsInitialTab, setToolsInitialTab] = useState<'kalkulator' | 'audio' | 'backup'>('kalkulator');

    const handleOpenTools = (tab: 'kalkulator' | 'audio' | 'backup' = 'kalkulator') => {
        setToolsInitialTab(tab);
        setIsToolsModalOpen(true);
    };

    const handleRestoreData = (backupData: {
        santri?: Santri[];
        setoran?: SetoranRecord[];
        jurnal?: JurnalBelajarSantri[];
        rencana?: RencanaSetoran[];
        kelas?: KelasTahfidz[];
        mapel?: MataPelajaranTahfidz[];
    }) => {
        if (backupData.santri && backupData.santri.length > 0) {
            setSantriList(backupData.santri);
        }
        if (backupData.setoran && backupData.setoran.length > 0) {
            setSetoranList(backupData.setoran);
        }
        if (backupData.jurnal && backupData.jurnal.length > 0) {
            setJurnalList(backupData.jurnal);
        }
        if (backupData.rencana && backupData.rencana.length > 0) {
            setRencanaList(backupData.rencana);
        }
        if (backupData.kelas && backupData.kelas.length > 0) {
            setKelasList(backupData.kelas);
        }
        if (backupData.mapel && backupData.mapel.length > 0) {
            setMapelList(backupData.mapel);
        }
    };

    // Current santri 30 Juz progress
    const activeJuzProgressMap = activeJuzSantri?.juzProgress || createDefaultJuzProgress(activeJuzSantri?.totalHafalanJuz || 0);
    const totalMutqin = Object.values(activeJuzProgressMap).filter(j => j.status === 'Mutqin').length;
    const totalSedangBerjalan = Object.values(activeJuzProgressMap).filter(j => j.status === 'Sedang Berjalan').length;
    const totalPerluMurojaah = Object.values(activeJuzProgressMap).filter(j => j.status === "Perlu Muroja'ah").length;
    const totalBelum = 30 - totalMutqin - totalSedangBerjalan - totalPerluMurojaah;
    const percentageComplete = Math.round((totalMutqin / 30) * 100);

    // Calculate learning stats for Santri
    const santriJurnals = jurnalList.filter(j => j.santriId === currentSantri?.id);
    const displayedJurnals = isSantri
        ? santriJurnals
        : (jurnalFilterSantriId === 'Semua' ? jurnalList : jurnalList.filter(j => j.santriId === jurnalFilterSantriId));

    const totalMenitBelajar = santriJurnals.reduce((sum, j) => sum + (j.durasiMenit || 0), 0);
    const totalSesiBelajar = santriJurnals.length;

    // Submissions filtering for Santri vs Ustadz/Admin
    const santriRencana = isSantri
        ? rencanaList.filter(r => r.santriId === currentSantri?.id)
        : rencanaList.filter(r => {
            const matchSantri = rencanaFilterSantriId === 'Semua' || r.santriId === rencanaFilterSantriId;
            const matchStatus = rencanaFilterStatus === 'Semua' || r.status === rencanaFilterStatus;
            return matchSantri && matchStatus;
        });

    // Handlers
    const handleSaveJurnal = (e: React.FormEvent) => {
        e.preventDefault();
        const surahObj = QURAN_SURAHS.find(s => s.nomor === jurnalSurahNomor) || QURAN_SURAHS[0];
        const newJurnal: JurnalBelajarSantri = {
            id: `jrn-${Date.now()}`,
            santriId: currentSantri.id,
            tanggal: new Date().toISOString().split('T')[0],
            kegiatan: jurnalKegiatan,
            surat: surahObj.nama,
            ayatAwal: parseInt(jurnalAyatAwal) || 1,
            ayatAkhir: parseInt(jurnalAyatAkhir) || surahObj.ayat,
            juz: parseInt(jurnalJuz) || surahObj.juz,
            durasiMenit: parseInt(jurnalDurasi) || 30,
            tingkatKelancaran: jurnalKelancaran,
            catatanAyatSulit: jurnalCatatanSulit.trim() || 'Alhamdulillah lancar dan dipahami',
            status: 'Selesai'
        };

        setJurnalList([newJurnal, ...jurnalList]);
        syncJurnalDoc(newJurnal);

        // Update streak & bookmark
        setSantriList(santriList.map(s => {
            if (s.id === currentSantri.id) {
                const updated = {
                    ...s,
                    streakHari: (s.streakHari || 14) + 1,
                    lastReadBookmark: {
                        surat: surahObj.nama,
                        ayat: parseInt(jurnalAyatAkhir) || surahObj.ayat,
                        juz: parseInt(jurnalJuz) || surahObj.juz,
                        tanggal: new Date().toISOString().split('T')[0]
                    }
                };
                syncSantriDoc(updated);
                return updated;
            }
            return s;
        }));

        setIsAddJurnalOpen(false);
        setJurnalCatatanSulit('');
    };

    const handleSaveRencana = (e: React.FormEvent) => {
        e.preventDefault();
        const surahObj = QURAN_SURAHS.find(s => s.nomor === rencanaSurahNomor) || QURAN_SURAHS[0];
        const newRencana: RencanaSetoran = {
            id: `rcn-${Date.now()}`,
            santriId: currentSantri.id,
            tanggalTarget: rencanaTanggal,
            waktu: rencanaWaktu,
            jenis: rencanaJenis,
            surat: surahObj.nama,
            ayatAwal: parseInt(rencanaAyatAwal) || 1,
            ayatAkhir: parseInt(rencanaAyatAkhir) || 20,
            juz: parseInt(rencanaJuz) || surahObj.juz,
            status: 'Diajukan',
            catatanSantri: rencanaCatatan.trim() || 'InsyaAllah sudah dimuroja\'ah mandiri'
        };

        setRencanaList([newRencana, ...rencanaList]);
        syncRencanaDoc(newRencana);
        setIsAddRencanaOpen(false);
        setRencanaCatatan('');
    };

    const handleApproveRencana = (id: string, newStatus: 'Disetujui Musyrif' | 'Selesai Disetorkan') => {
        setRencanaList(rencanaList.map(r => {
            if (r.id === id) {
                const updated = { ...r, status: newStatus };
                syncRencanaDoc(updated);
                return updated;
            }
            return r;
        }));
    };

    const handleSaveBookmark = (e: React.FormEvent) => {
        e.preventDefault();
        const surahObj = QURAN_SURAHS.find(s => s.nomor === bmSurahNomor) || QURAN_SURAHS[0];
        setSantriList(santriList.map(s => {
            if (s.id === currentSantri.id) {
                const updated = {
                    ...s,
                    lastReadBookmark: {
                        surat: surahObj.nama,
                        ayat: parseInt(bmAyat) || 1,
                        juz: surahObj.juz,
                        tanggal: new Date().toISOString().split('T')[0]
                    }
                };
                syncSantriDoc(updated);
                return updated;
            }
            return s;
        }));
        setIsBookmarkModalOpen(false);
    };

    const handleOpenJuzModal = (juzNum: number) => {
        const existing = activeJuzProgressMap[juzNum];
        setActiveJuzModal(juzNum);
        setModalJuzStatus(existing?.status || (juzNum <= activeJuzSantri.totalHafalanJuz ? 'Mutqin' : 'Belum'));
        setModalJuzNilai(existing?.nilaiTasmi || 'A (Mumtaz)');
        setModalJuzTanggal(existing?.tanggalUjian || new Date().toISOString().split('T')[0]);
        setModalJuzPenguji(existing?.penguji || user?.nama || 'Ustadz Pembina');
        setModalJuzCatatan(existing?.catatan || '');
    };

    const handleSaveJuzProgress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeJuzModal || !activeJuzSantri) return;

        const updatedRecord: JuzProgressRecord = {
            juz: activeJuzModal,
            status: modalJuzStatus,
            nilaiTasmi: modalJuzStatus === 'Mutqin' ? modalJuzNilai : undefined,
            tanggalUjian: modalJuzStatus === 'Mutqin' ? modalJuzTanggal : undefined,
            penguji: modalJuzPenguji,
            catatan: modalJuzCatatan.trim()
        };

        const updatedProgressMap = {
            ...activeJuzProgressMap,
            [activeJuzModal]: updatedRecord
        };

        const newTotalCompleted = Object.values(updatedProgressMap).filter(r => r.status === 'Mutqin').length;

        const updatedSantriList = santriList.map(s => {
            if (s.id === activeJuzSantri.id) {
                const updated = {
                    ...s,
                    totalHafalanJuz: newTotalCompleted,
                    juzProgress: updatedProgressMap
                };
                syncSantriDoc(updated);
                return updated;
            }
            return s;
        });

        setSantriList(updatedSantriList);
        setActiveJuzModal(null);
    };

    const handleSurahChange = (nomor: number) => {
        setSelectedSurahNomor(nomor);
        const surah = QURAN_SURAHS.find(s => s.nomor === nomor);
        if (surah) {
            setFormJuz(String(surah.juz));
            setFormAyatAwal('1');
            setFormAyatAkhir(String(Math.min(surah.ayat, 20)));
        }
    };

    const handleSaveSetoran = (e: React.FormEvent) => {
        e.preventDefault();
        const targetSantri = santriList.find(s => s.id === selectedSantriId) || santriList[0];
        const surahObj = QURAN_SURAHS.find(s => s.nomor === selectedSurahNomor) || QURAN_SURAHS[0];

        const newRecord: SetoranRecord = {
            id: `set-${Date.now()}`,
            santriId: targetSantri.id,
            santriNama: targetSantri.nama,
            tanggal: new Date().toISOString().split('T')[0],
            jenis: formJenis,
            surat: surahObj.nama,
            ayatAwal: parseInt(formAyatAwal) || 1,
            ayatAkhir: parseInt(formAyatAkhir) || surahObj.ayat,
            juz: parseInt(formJuz) || surahObj.juz,
            nilai: formNilai,
            musyrif: user?.nama || 'Ustadz Pembina',
            catatan: formCatatan.trim() || 'Alhamdulillah lancar dan tartil'
        };

        setSetoranList([newRecord, ...setoranList]);
        syncSetoranDoc(newRecord);

        // If this setoran was launched from an approved plan, automatically mark the plan completed
        if (linkedRencanaId) {
            handleApproveRencana(linkedRencanaId, 'Selesai Disetorkan');
            setLinkedRencanaId(null);
        }

        setSantriList(santriList.map(s => {
            if (s.id === targetSantri.id) {
                const calculatedJuz = Math.max(s.totalHafalanJuz, formJenis === 'Ziyadah' ? parseInt(formJuz) || s.totalHafalanJuz : s.totalHafalanJuz);
                const updated = {
                    ...s,
                    totalHafalanJuz: calculatedJuz,
                    suratTerakhir: `${surahObj.nama} : ${formAyatAwal}-${formAyatAkhir}`
                };
                syncSantriDoc(updated);
                return updated;
            }
            return s;
        }));

        setIsAddSetoranOpen(false);
        setFormCatatan('');
    };

    // Cross-Role Workflow 1: Ustadz launches direct setoran tasmi' test from student's planned submission
    const handleStartSetoranFromRencana = (rcn: RencanaSetoran) => {
        setSelectedSantriId(rcn.santriId);
        setFormJenis(rcn.jenis);
        const sObj = QURAN_SURAHS.find(s => s.nama.toLowerCase() === rcn.surat.toLowerCase()) || QURAN_SURAHS[0];
        setSelectedSurahNomor(sObj.nomor);
        setFormAyatAwal(String(rcn.ayatAwal));
        setFormAyatAkhir(String(rcn.ayatAkhir));
        setFormJuz(String(rcn.juz));
        setFormCatatan(rcn.catatanSantri ? `Rencana Santri: "${rcn.catatanSantri}". Evaluasi musyrif: ` : '');
        setLinkedRencanaId(rcn.id);
        setIsAddSetoranOpen(true);
    };

    // Cross-Role Workflow 2: Ustadz / Admin evaluates and provides direct paraf/bimbingan to student self-study journal
    const handleOpenBimbinganJurnal = (jrn: JurnalBelajarSantri) => {
        setBimbinganTargetJurnal(jrn);
        setBimbinganText(jrn.catatanMusyrif || '');
        setIsBimbinganJurnalOpen(true);
    };

    const handleSaveBimbinganJurnal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bimbinganTargetJurnal) return;
        const updatedList = jurnalList.map(j => {
            if (j.id === bimbinganTargetJurnal.id) {
                const updated: JurnalBelajarSantri = {
                    ...j,
                    catatanMusyrif: bimbinganText.trim(),
                    parafMusyrif: user?.nama || (isAdmin ? 'M. Asngad (Admin)' : 'Ustadz Abdullah Mukhtar, S.Pd.I')
                };
                syncJurnalDoc(updated);
                return updated;
            }
            return j;
        });
        setJurnalList(updatedList);
        setIsBimbinganJurnalOpen(false);
        setBimbinganTargetJurnal(null);
    };

    const handleSaveSantri = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNama.trim() || !newNis.trim()) return;

        const totalJuzInt = parseInt(newTotalJuz) || 0;
        const newSantri: Santri = {
            id: `s-${Date.now()}`,
            nis: newNis.trim(),
            nama: newNama.trim(),
            kelas: newKelas,
            halaqah: newHalaqah,
            musyrif: newMusyrif,
            totalHafalanJuz: totalJuzInt,
            suratTerakhir: 'Memulai juz awal',
            status: newStatus,
            juzProgress: createDefaultJuzProgress(totalJuzInt),
            streakHari: 1,
            targetKhatam: 'Ramadhan 1448 H',
            targetHalamanPerHari: 1
        };

        setSantriList([...santriList, newSantri]);
        syncSantriDoc(newSantri);
        setIsAddSantriOpen(false);
        setNewNis('');
        setNewNama('');
    };

    // Admin Handlers: Edit & Delete Santri
    const handleOpenEditSantri = (s: Santri) => {
        setEditSantriId(s.id);
        setEditNis(s.nis);
        setEditNama(s.nama);
        setEditKelas(s.kelas);
        setEditHalaqah(s.halaqah);
        setEditMusyrif(s.musyrif);
        setEditStatus(s.status || 'Aktif');
        setEditTotalJuz(String(s.totalHafalanJuz || 0));
        setEditTargetKhatam(s.targetKhatam || 'Ramadhan 1448 H');
        setIsEditSantriOpen(true);
    };

    const handleUpdateSantri = (e: React.FormEvent) => {
        e.preventDefault();
        const totalJuzInt = parseInt(editTotalJuz) || 0;
        const updatedList = santriList.map(s => {
            if (s.id === editSantriId) {
                const updated: Santri = {
                    ...s,
                    nis: editNis.trim(),
                    nama: editNama.trim(),
                    kelas: editKelas.trim(),
                    halaqah: editHalaqah.trim(),
                    musyrif: editMusyrif.trim(),
                    status: editStatus,
                    totalHafalanJuz: totalJuzInt,
                    targetKhatam: editTargetKhatam.trim(),
                    juzProgress: s.juzProgress || createDefaultJuzProgress(totalJuzInt)
                };
                syncSantriDoc(updated);
                return updated;
            }
            return s;
        });
        setSantriList(updatedList);
        setIsEditSantriOpen(false);
    };

    const handleConfirmDeleteSantri = () => {
        if (!deleteSantriTarget) return;
        const targetId = deleteSantriTarget.id;
        setSantriList(santriList.filter(s => s.id !== targetId));
        deleteSantriDoc(targetId);
        setDeleteSantriTarget(null);
    };

    // Ustadz Handlers: Edit & Delete Setoran
    const handleOpenEditSetoran = (r: SetoranRecord) => {
        setEditSetoranId(r.id);
        setEditSetoranSantriId(r.santriId);
        setEditSetoranJenis(r.jenis);
        const surahObj = QURAN_SURAHS.find(s => s.nama.toLowerCase() === r.surat.toLowerCase()) || QURAN_SURAHS[0];
        setEditSetoranSurahNomor(surahObj.nomor);
        setEditSetoranAyatAwal(String(r.ayatAwal));
        setEditSetoranAyatAkhir(String(r.ayatAkhir));
        setEditSetoranJuz(String(r.juz));
        setEditSetoranNilai(r.nilai);
        setEditSetoranCatatan(r.catatan || '');
        setIsEditSetoranOpen(true);
    };

    const handleUpdateSetoran = (e: React.FormEvent) => {
        e.preventDefault();
        const surahObj = QURAN_SURAHS.find(s => s.nomor === editSetoranSurahNomor) || QURAN_SURAHS[0];
        const targetSantri = santriList.find(s => s.id === editSetoranSantriId);

        const updatedSetoranList = setoranList.map(item => {
            if (item.id === editSetoranId) {
                const updated: SetoranRecord = {
                    ...item,
                    santriId: editSetoranSantriId,
                    santriNama: targetSantri?.nama || item.santriNama,
                    jenis: editSetoranJenis,
                    surat: surahObj.nama,
                    ayatAwal: parseInt(editSetoranAyatAwal) || 1,
                    ayatAkhir: parseInt(editSetoranAyatAkhir) || surahObj.ayat,
                    juz: parseInt(editSetoranJuz) || surahObj.juz,
                    nilai: editSetoranNilai,
                    catatan: editSetoranCatatan.trim()
                };
                syncSetoranDoc(updated);
                return updated;
            }
            return item;
        });
        setSetoranList(updatedSetoranList);
        setIsEditSetoranOpen(false);
    };

    const handleConfirmDeleteSetoran = () => {
        if (!deleteSetoranTarget) return;
        const targetId = deleteSetoranTarget.id;
        setSetoranList(setoranList.filter(s => s.id !== targetId));
        deleteSetoranDoc(targetId);
        setDeleteSetoranTarget(null);
    };

    // Santri Handlers: Edit & Delete Jurnal Belajar
    const handleOpenEditJurnal = (j: JurnalBelajarSantri) => {
        setEditJurnalId(j.id);
        setEditJurnalKegiatan(j.kegiatan);
        const surahObj = QURAN_SURAHS.find(s => s.nama.toLowerCase() === j.surat.toLowerCase()) || QURAN_SURAHS[0];
        setEditJurnalSurahNomor(surahObj.nomor);
        setEditJurnalAyatAwal(String(j.ayatAwal));
        setEditJurnalAyatAkhir(String(j.ayatAkhir));
        setEditJurnalJuz(String(j.juz));
        setEditJurnalDurasi(String(j.durasiMenit));
        setEditJurnalKelancaran(j.tingkatKelancaran);
        setEditJurnalCatatanSulit(j.catatanAyatSulit || '');
        setIsEditJurnalOpen(true);
    };

    const handleUpdateJurnal = (e: React.FormEvent) => {
        e.preventDefault();
        const surahObj = QURAN_SURAHS.find(s => s.nomor === editJurnalSurahNomor) || QURAN_SURAHS[0];
        const updatedJurnalList = jurnalList.map(j => {
            if (j.id === editJurnalId) {
                const updated: JurnalBelajarSantri = {
                    ...j,
                    kegiatan: editJurnalKegiatan,
                    surat: surahObj.nama,
                    ayatAwal: parseInt(editJurnalAyatAwal) || 1,
                    ayatAkhir: parseInt(editJurnalAyatAkhir) || surahObj.ayat,
                    juz: parseInt(editJurnalJuz) || surahObj.juz,
                    durasiMenit: parseInt(editJurnalDurasi) || 30,
                    tingkatKelancaran: editJurnalKelancaran,
                    catatanAyatSulit: editJurnalCatatanSulit.trim()
                };
                syncJurnalDoc(updated);
                return updated;
            }
            return j;
        });
        setJurnalList(updatedJurnalList);
        setIsEditJurnalOpen(false);
    };

    const handleConfirmDeleteJurnal = () => {
        if (!deleteJurnalTarget) return;
        const targetId = deleteJurnalTarget.id;
        setJurnalList(jurnalList.filter(j => j.id !== targetId));
        deleteJurnalDoc(targetId);
        setDeleteJurnalTarget(null);
    };

    // Santri Handlers: Edit & Delete Rencana Setoran
    const handleOpenEditRencana = (r: RencanaSetoran) => {
        setEditRencanaId(r.id);
        setEditRencanaTanggal(r.tanggalTarget);
        setEditRencanaWaktu(r.waktu);
        setEditRencanaJenis(r.jenis);
        const surahObj = QURAN_SURAHS.find(s => s.nama.toLowerCase() === r.surat.toLowerCase()) || QURAN_SURAHS[0];
        setEditRencanaSurahNomor(surahObj.nomor);
        setEditRencanaAyatAwal(String(r.ayatAwal));
        setEditRencanaAyatAkhir(String(r.ayatAkhir));
        setEditRencanaJuz(String(r.juz));
        setEditRencanaCatatan(r.catatanSantri || '');
        setIsEditRencanaOpen(true);
    };

    const handleUpdateRencana = (e: React.FormEvent) => {
        e.preventDefault();
        const surahObj = QURAN_SURAHS.find(s => s.nomor === editRencanaSurahNomor) || QURAN_SURAHS[0];
        const updatedRencanaList = rencanaList.map(r => {
            if (r.id === editRencanaId) {
                const updated: RencanaSetoran = {
                    ...r,
                    tanggalTarget: editRencanaTanggal,
                    waktu: editRencanaWaktu,
                    jenis: editRencanaJenis,
                    surat: surahObj.nama,
                    ayatAwal: parseInt(editRencanaAyatAwal) || 1,
                    ayatAkhir: parseInt(editRencanaAyatAkhir) || 20,
                    juz: parseInt(editRencanaJuz) || surahObj.juz,
                    catatanSantri: editRencanaCatatan.trim()
                };
                syncRencanaDoc(updated);
                return updated;
            }
            return r;
        });
        setRencanaList(updatedRencanaList);
        setIsEditRencanaOpen(false);
    };

    const handleConfirmDeleteRencana = () => {
        if (!deleteRencanaTarget) return;
        const targetId = deleteRencanaTarget.id;
        setRencanaList(rencanaList.filter(r => r.id !== targetId));
        deleteRencanaDoc(targetId);
        setDeleteRencanaTarget(null);
    };

    const handleTestBackend = async () => {
        if (!inputUrl.trim() || !inputUrl.startsWith('https://script.google.com')) {
            setTestConnectionStatus({
                loading: false,
                success: false,
                message: 'URL belum valid. Pastikan dimulai dengan https://script.google.com/macros/s/.../exec'
            });
            return;
        }

        setTestConnectionStatus({ loading: true });
        try {
            const start = performance.now();
            await callAPI(inputUrl.trim(), { action: 'ping' });
            const duration = Math.round(performance.now() - start);
            setTestConnectionStatus({
                loading: false,
                success: true,
                message: `Berhasil terhubung ke server Google Apps Script! (Respon: ${duration} ms)`
            });
        } catch (err: any) {
            setTestConnectionStatus({
                loading: false,
                success: false,
                message: `Gagal terhubung: ${err.message}. Pastikan izin deployment Web App adalah "Who has access: Anyone".`
            });
        }
    };

    const exportCSV = () => {
        const headers = ["ID", "Santri", "Tanggal", "Jenis", "Surat", "Ayat Awal", "Ayat Akhir", "Juz", "Nilai", "Musyrif", "Catatan"];
        const rows = setoranList.map(item => [
            item.id,
            `"${item.santriNama}"`,
            item.tanggal,
            item.jenis,
            `"${item.surat}"`,
            item.ayatAwal,
            item.ayatAkhir,
            item.juz,
            `"${item.nilai}"`,
            `"${item.musyrif}"`,
            `"${item.catatan || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `rekap_tahfidz_darul_kamal_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtered lists
    const filteredSantri = santriList.filter(s => {
        const matchesQuery = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.nis.includes(searchQuery) ||
            s.halaqah.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterSantriStatus === 'Semua' || s.status === filterSantriStatus;
        return matchesQuery && matchesStatus;
    });

    const filteredSetoran = setoranList.filter(item => {
        const matchesJenis = filterJenis === 'Semua' || item.jenis === filterJenis;
        const matchesSantri = filterSantriId === 'Semua' || item.santriId === filterSantriId;
        if (isSantri) {
            return matchesJenis && (item.santriNama.toLowerCase().includes(user?.nama?.toLowerCase() || '') || item.santriId === currentSantri?.id);
        }
        return matchesJenis && matchesSantri;
    });

    const activeMeta = activeJuzModal ? JUZ_METADATA.find(m => m.juz === activeJuzModal) : null;
    const modalJuzSetoran = activeJuzModal 
        ? setoranList.filter(s => s.juz === activeJuzModal && s.santriId === activeJuzSantri?.id)
        : [];

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar Desktop */}
            <aside className="bg-emerald-900 text-white w-full md:w-64 hidden md:flex flex-col shadow-2xl z-20 shrink-0">
                <div className="p-6 border-b border-emerald-800/80 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200 mb-2 shadow-inner">
                        <i className="fas fa-quran text-xl"></i>
                    </div>
                    <h1 className="font-arab text-2xl font-bold tracking-wide">دار الكمال</h1>
                    <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mt-0.5">E-Tahfidz Darul Kamal</p>
                    <div className="mt-2.5">
                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold shadow-xs inline-flex items-center gap-1.5 ${
                            isAdmin ? 'bg-amber-400 text-amber-950 border border-amber-300' :
                            isUstadz ? 'bg-blue-400 text-blue-950 border border-blue-300' :
                            'bg-emerald-400 text-emerald-950 border border-emerald-300'
                        }`}>
                            <i className={`fas ${isAdmin ? 'fa-user-shield' : isUstadz ? 'fa-chalkboard-teacher' : 'fa-user-graduate'}`}></i>
                            {isAdmin ? 'M. Asngad (Admin)' : isUstadz ? 'Dewan Ustadz / Musyrif' : 'Santri Tahfidz'}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {/* NAVIGASI KHUSUS ADMIN */}
                    {isAdmin && (
                        <>
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                Menu Administrator
                            </div>
                            <button 
                                onClick={() => setActiveTab('dashboard')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'dashboard' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-chart-line w-4 text-center text-amber-300"></i>
                                <span>Dashboard Eksekutif</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('santri')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'santri' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-users-cog w-4 text-center text-emerald-300"></i>
                                <span>Kelola Data Santri (CRUD)</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{santriList.length}</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('kelas_mapel')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'kelas_mapel' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-graduation-cap w-4 text-center text-amber-300"></i>
                                <span>Kelas &amp; Mata Pelajaran</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{kelasList.length} Kls</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('hafalan')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'hafalan' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-book-quran w-4 text-center text-teal-300"></i>
                                <span>Peta 30 Juz Santri</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('setoran')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'setoran' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-clipboard-check w-4 text-center text-blue-300"></i>
                                <span>Audit &amp; Rekap Setoran</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{setoranList.length}</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('halaqah')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'halaqah' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-mosque w-4 text-center text-amber-200"></i>
                                <span>Manajemen Halaqah</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('pengaturan')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'pengaturan' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-database w-4 text-center text-purple-300"></i>
                                <span>Database &amp; Pengaturan</span>
                            </button>
                        </>
                    )}

                    {/* NAVIGASI KHUSUS USTADZ */}
                    {isUstadz && (
                        <>
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                                Menu Ustadz / Musyrif
                            </div>
                            <button 
                                onClick={() => setActiveTab('dashboard')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'dashboard' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-home w-4 text-center text-amber-300"></i>
                                <span>Beranda Halaqah</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('kelas_mapel')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'kelas_mapel' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-chalkboard-teacher w-4 text-center text-amber-300"></i>
                                <span>Kelas &amp; Jadwal Mengajar</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{kelasList.length} Kls</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('setoran')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'setoran' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-book-reader w-4 text-center text-emerald-300"></i>
                                <span>Setoran &amp; Tasmi' (CRUD)</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{setoranList.length}</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('hafalan')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'hafalan' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-award w-4 text-center text-amber-300"></i>
                                <span>Validasi Kelulusan 30 Juz</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('rencana')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'rencana' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-calendar-check w-4 text-center text-teal-300"></i>
                                <span>Approval Rencana Setoran</span>
                                {rencanaList.filter(r => r.status === 'Diajukan').length > 0 && (
                                    <span className="ml-auto text-[10px] bg-amber-500 text-amber-950 font-bold px-2 py-0.5 rounded-full">
                                        {rencanaList.filter(r => r.status === 'Diajukan').length} Antrean
                                    </span>
                                )}
                            </button>

                            <button 
                                onClick={() => setActiveTab('jurnal')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'jurnal' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-clipboard-list w-4 text-center text-purple-300"></i>
                                <span>Pantau Mutaba'ah Santri</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{jurnalList.length}</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('santri')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'santri' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-user-friends w-4 text-center text-blue-200"></i>
                                <span>Santri Halaqah Binaan</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{santriList.length}</span>
                            </button>
                        </>
                    )}

                    {/* NAVIGASI KHUSUS SANTRI */}
                    {isSantri && (
                        <>
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                Menu Santri Tahfidz
                            </div>
                            <button 
                                onClick={() => setActiveTab('dashboard')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'dashboard' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-home w-4 text-center text-amber-300"></i>
                                <span>Ruang Belajar Santri</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('kelas_mapel')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'kelas_mapel' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-graduation-cap w-4 text-center text-amber-300"></i>
                                <span>Kelas &amp; Mata Pelajaran Saya</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('hafalan')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'hafalan' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-book-quran w-4 text-center text-teal-300"></i>
                                <span>Peta 30 Juz Saya</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('jurnal')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'jurnal' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-pen-nib w-4 text-center text-amber-300"></i>
                                <span>Jurnal Mutaba'ah Mandiri</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{santriJurnals.length}</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('rencana')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'rencana' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-calendar-plus w-4 text-center text-teal-200"></i>
                                <span>Rencana Setoran ke Ustadz</span>
                                <span className="ml-auto text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">{santriRencana.length}</span>
                            </button>

                            <button 
                                onClick={() => setActiveTab('setoran')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-3 text-xs ${
                                    activeTab === 'setoran' ? 'bg-emerald-800 text-white shadow-md font-bold' : 'text-emerald-100 hover:bg-emerald-800/50'
                                }`}
                            >
                                <i className="fas fa-certificate w-4 text-center text-amber-300"></i>
                                <span>Riwayat Nilai Tasmi'</span>
                            </button>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-emerald-800/60 bg-emerald-950/40">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-sm">
                            {isAdmin ? 'M' : (user?.nama ? user.nama.charAt(0) : 'U')}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{isAdmin ? 'M. Asngad' : (user?.nama || 'Pengguna')}</p>
                            <p className="text-[11px] text-emerald-300 truncate">
                                {isAdmin ? 'Administrator Utama' : isUstadz ? 'Ustadz Pembina' : currentSantri?.kelas || 'Santri'}
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="danger" 
                        onClick={onLogout} 
                        className="w-full py-2 text-xs flex justify-center items-center"
                        icon="fas fa-sign-out-alt"
                    >
                        Keluar Akun
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden bg-emerald-900 text-white p-4 flex justify-between items-center shadow-md z-30 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200">
                        <i className="fas fa-quran text-sm"></i>
                    </div>
                    <h1 className="font-arab text-xl font-bold">دار الكمال</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-800 px-2.5 py-1 rounded-full text-emerald-200 font-semibold truncate max-w-[120px]">
                        {isAdmin ? 'M. Asngad' : isUstadz ? 'Ustadz' : user?.nama?.split(' ')[0] || 'Santri'}
                    </span>
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-white hover:text-emerald-200 p-2"
                    >
                        <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
                    </button>
                </div>
            </header>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-emerald-950 text-white px-4 py-3 space-y-2 border-b border-emerald-800 z-30 text-xs">
                    <button onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                        <i className="fas fa-home w-5"></i> Dashboard
                    </button>
                    {isAdmin && (
                        <>
                            <button onClick={() => { setActiveTab('santri'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-users-cog w-5"></i> Kelola Data Santri
                            </button>
                            <button onClick={() => { setActiveTab('kelas_mapel'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2 text-amber-300">
                                <i className="fas fa-graduation-cap w-5"></i> Kelas &amp; Mata Pelajaran
                            </button>
                            <button onClick={() => { setActiveTab('halaqah'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-mosque w-5"></i> Manajemen Halaqah
                            </button>
                            <button onClick={() => { setActiveTab('pengaturan'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-database w-5"></i> Pengaturan &amp; Database
                            </button>
                        </>
                    )}
                    {isUstadz && (
                        <>
                            <button onClick={() => { setActiveTab('kelas_mapel'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2 text-amber-300">
                                <i className="fas fa-chalkboard-teacher w-5"></i> Kelas &amp; Jadwal Mengajar
                            </button>
                            <button onClick={() => { setActiveTab('setoran'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-book-reader w-5"></i> Setoran &amp; Tasmi' (CRUD)
                            </button>
                            <button onClick={() => { setActiveTab('hafalan'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-award w-5"></i> Validasi 30 Juz
                            </button>
                            <button onClick={() => { setActiveTab('rencana'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-calendar-check w-5"></i> Approval Rencana Setoran
                            </button>
                            <button onClick={() => { setActiveTab('jurnal'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-clipboard-list w-5"></i> Pantau Mutaba'ah Santri
                            </button>
                        </>
                    )}
                    {isSantri && (
                        <>
                            <button onClick={() => { setActiveTab('kelas_mapel'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2 text-amber-300">
                                <i className="fas fa-graduation-cap w-5"></i> Kelas &amp; Mata Pelajaran Saya
                            </button>
                            <button onClick={() => { setActiveTab('hafalan'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2 text-teal-300">
                                <i className="fas fa-book-quran w-5"></i> Peta 30 Juz Saya
                            </button>
                            <button onClick={() => { setActiveTab('jurnal'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2 text-amber-300">
                                <i className="fas fa-pen-nib w-5"></i> Jurnal Mutaba'ah Mandiri
                            </button>
                            <button onClick={() => { setActiveTab('rencana'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2 text-teal-200">
                                <i className="fas fa-calendar-plus w-5"></i> Rencana Setoran ke Ustadz
                            </button>
                            <button onClick={() => { setActiveTab('setoran'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 flex items-center gap-2">
                                <i className="fas fa-certificate w-5"></i> Riwayat Nilai Tasmi'
                            </button>
                        </>
                    )}
                    <button onClick={onLogout} className="w-full text-left py-2 px-3 rounded bg-red-600/80 text-white font-semibold flex items-center gap-2 mt-2">
                        <i className="fas fa-sign-out-alt w-5"></i> Keluar Akun
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {/* Top Action Header with Dynamic Role Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                E-Tahfidz Pesantren Darul Kamal
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                isAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                isUstadz ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                                Peran: {isAdmin ? 'Administrator (M. Asngad)' : isUstadz ? 'Ustadz Pembina (Musyrif)' : 'Santri Tahfidz (Pelajar)'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {activeTab === 'dashboard' && (isAdmin ? 'Dashboard Eksekutif Lembaga' : isUstadz ? 'Beranda Pembinaan Halaqah' : 'Ruang Belajar & Hafalan Pribadi')}
                            {activeTab === 'jurnal' && (isSantri ? 'Jurnal Mutaba\'ah Belajar Mandiri' : 'Monitoring Mutaba\'ah Jurnal Santri')}
                            {activeTab === 'rencana' && (isSantri ? 'Rencana & Target Setoran ke Ustadz' : 'Verifikasi & Approval Rencana Setoran')}
                            {activeTab === 'hafalan' && (isSantri ? 'Peta Progres 30 Juz Saya' : 'Validasi & Otorisasi 30 Juz Santri')}
                            {activeTab === 'santri' && (isAdmin ? 'Kelola Master Data Santri' : 'Santri Halaqah Binaan')}
                            {activeTab === 'setoran' && (isSantri ? 'Riwayat Evaluasi Nilai Tasmi\'' : isUstadz ? 'Catatan Nilai Setoran & Tasmi\' (CRUD)' : 'Audit & Rekapitulasi Setoran')}
                            {activeTab === 'halaqah' && 'Manajemen Halaqah & Asatidz Pembina'}
                            {activeTab === 'pengaturan' && 'Status Database & Pengaturan Cloud'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isAdmin && 'Kelola master data santri, halaqah, monitoring institusi, dan rekapitulasi audit tahfidz.'}
                            {isUstadz && 'Input setoran tasmi\', penilaian tajwid & makhorij, pengesahan kelulusan juz, dan approval rencana.'}
                            {isSantri && 'Pantau pencapaian 30 juz, ajukan rencana target setoran, dan catat jurnal muroja\'ah harian.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* ROLE SWITCHER WIDGET: Memudahkan verifikasi fungsionalitas tiap peran */}
                        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs shadow-2xs">
                            <span className="text-[11px] font-bold text-gray-600 px-2 flex items-center gap-1">
                                <i className="fas fa-sync-alt text-gray-400"></i> Mode Peran:
                            </span>
                            <button
                                onClick={() => { setCurrentRoleOverride('admin'); setActiveTab('dashboard'); }}
                                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                    isAdmin ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                }`}
                                title="Beralih ke tampilan Administrator Pesantren"
                            >
                                <i className="fas fa-user-shield mr-1"></i> Admin
                            </button>
                            <button
                                onClick={() => { setCurrentRoleOverride('ustadz'); setActiveTab('dashboard'); }}
                                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                    isUstadz ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                }`}
                                title="Beralih ke tampilan Ustadz / Musyrif Halaqah"
                            >
                                <i className="fas fa-chalkboard-teacher mr-1"></i> Ustadz
                            </button>
                            <button
                                onClick={() => { setCurrentRoleOverride('santri'); setActiveTab('dashboard'); }}
                                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                    isSantri ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                }`}
                                title="Beralih ke tampilan Santri Tahfidz"
                            >
                                <i className="fas fa-user-graduate mr-1"></i> Santri
                            </button>
                        </div>

                        {/* SIMULASI SANTRI SWITCHER (Memungkinkan pengujian profil santri berbeda: 7 Juz, 15 Juz, 30 Juz) */}
                        {isSantri && (
                            <div className="flex items-center bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-xs shadow-2xs">
                                <span className="font-bold text-emerald-900 mr-2 flex items-center gap-1">
                                    <i className="fas fa-id-badge text-emerald-700"></i> Akun Santri:
                                </span>
                                <select
                                    value={simulatedSantriId || currentSantri.id}
                                    onChange={(e) => {
                                        setSimulatedSantriId(e.target.value);
                                        setSelectedJuzSantriId(e.target.value);
                                    }}
                                    className="bg-white border border-emerald-300 text-emerald-950 font-semibold rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    {santriList.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.nama} ({s.totalHafalanJuz} Juz • {s.status || 'Aktif'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Quick Action Buttons Sesuai Peran */}
                        {isSantri && (
                            <>
                                <button
                                    onClick={() => setIsAddJurnalOpen(true)}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                >
                                    <i className="fas fa-pen-nib"></i>
                                    <span>Tulis Jurnal Belajar</span>
                                </button>
                                <button
                                    onClick={() => setIsAddRencanaOpen(true)}
                                    className="bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                >
                                    <i className="fas fa-calendar-plus"></i>
                                    <span>Ajukan Target Setoran</span>
                                </button>
                            </>
                        )}

                        {isUstadz && (
                            <button
                                onClick={() => setIsAddSetoranOpen(true)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                            >
                                <i className="fas fa-plus"></i>
                                <span>Catat Setoran Baru (Tasmi')</span>
                            </button>
                        )}

                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setIsAddSantriOpen(true)}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                >
                                    <i className="fas fa-user-plus"></i>
                                    <span>Tambah Santri Baru</span>
                                </button>
                                <button
                                    onClick={exportCSV}
                                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                >
                                    <i className="fas fa-file-csv text-emerald-600"></i>
                                    <span>Ekspor Laporan</span>
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => handleOpenTools('kalkulator')}
                            className="bg-emerald-850 hover:bg-emerald-900 text-white border border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                            title="Kalkulator Target 30 Juz, Audio Murattal & Cadangan Data"
                        >
                            <i className="fa-solid fa-toolbox text-amber-300"></i>
                            <span>Utilitas &amp; Murattal</span>
                        </button>
                    </div>
                </div>

                {/* TAB 1: DASHBOARD (Santri-focused & General) */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* ======================================================== */}
                        {/* VIEW 1: DASHBOARD EKSEKUTIF ADMINISTRATOR PESANTREN      */}
                        {/* ======================================================== */}
                        {isAdmin && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Admin Executive Banner */}
                                <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-800">
                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                                <i className="fas fa-shield-alt text-amber-400"></i> Panel Administrator Lembaga
                                            </span>
                                            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-emerald-200">
                                                Tahun Ajaran 1447-1448 H / 2026 M
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-bold">
                                            Pusat Monitoring Tahfidzul Qur'an Darul Kamal
                                        </h3>
                                        <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                                            Ringkasan statistik terpadu perkembangan hafalan 30 juz santri, pembagian halaqah asatidz, dan audit rekapitulasi nilai tasmi' harian.
                                        </p>
                                    </div>
                                    <div className="absolute right-4 -bottom-6 text-white/5 font-arab text-9xl pointer-events-none select-none">
                                        الإدارة
                                    </div>
                                </div>

                                {/* Metric Cards Eksekutif */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Santri Terdaftar</span>
                                            <div className="text-2xl font-bold text-gray-900 mt-1">{santriList.length} <span className="text-xs font-normal text-gray-500">Santri</span></div>
                                            <div className="flex gap-2 text-[10px] mt-1 font-semibold">
                                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{santriList.filter(s => s.status === 'Aktif').length} Aktif</span>
                                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{santriList.filter(s => s.status === 'Izin').length} Izin</span>
                                                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{santriList.filter(s => s.status === 'Mutakharij').length} Lulus</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-user-graduate"></i>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Akumulasi Juz Mutqin</span>
                                            <div className="text-2xl font-bold text-emerald-800 mt-1">
                                                {santriList.reduce((acc, s) => acc + (s.totalHafalanJuz || 0), 0)} <span className="text-xs font-normal text-gray-500">Juz Sah</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                Rata-rata: <strong>{(santriList.reduce((acc, s) => acc + (s.totalHafalanJuz || 0), 0) / (santriList.length || 1)).toFixed(1)}</strong> Juz/santri
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-quran"></i>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Setoran Tasmi' Tercatat</span>
                                            <div className="text-2xl font-bold text-blue-900 mt-1">{setoranList.length} <span className="text-xs font-normal text-gray-500">Sesi Ujian</span></div>
                                            <p className="text-[11px] text-blue-700 font-semibold mt-1">
                                                <i className="fas fa-check-double mr-1"></i> Tersinkron Real-time Cloud
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-certificate"></i>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Kelompok Halaqah</span>
                                            <div className="text-2xl font-bold text-teal-800 mt-1">4 <span className="text-xs font-normal text-gray-500">Halaqah Asatidz</span></div>
                                            <p className="text-[11px] text-teal-700 font-semibold mt-1">
                                                Binaan Ustadz Musyrif
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-mosque"></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Leaderboard & Halaqah Distribution Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Top Santri Tahfidz Leaderboard */}
                                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                    <i className="fas fa-trophy text-amber-500"></i> Peringkat Capaian Hafalan Santri (Top Tahfidz)
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-0.5">Santri dengan akumulasi Juz Mutqin tertinggi di pesantren.</p>
                                            </div>
                                            <button onClick={() => setActiveTab('santri')} className="text-xs text-emerald-700 font-bold hover:underline">
                                                Lihat Semua Santri
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-600 font-semibold uppercase text-[10px]">
                                                        <th className="py-2.5 px-3">#</th>
                                                        <th className="py-2.5 px-3">Santri</th>
                                                        <th className="py-2.5 px-3">Halaqah &amp; Pembina</th>
                                                        <th className="py-2.5 px-3">Capaian Mutqin</th>
                                                        <th className="py-2.5 px-3">Target Khatam</th>
                                                        <th className="py-2.5 px-3 text-right">Progres 30 Juz</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {[...santriList]
                                                        .sort((a, b) => (b.totalHafalanJuz || 0) - (a.totalHafalanJuz || 0))
                                                        .slice(0, 5)
                                                        .map((s, idx) => (
                                                            <tr key={s.id} className="hover:bg-emerald-50/50 transition">
                                                                <td className="py-3 px-3 font-bold text-gray-500">
                                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                                                </td>
                                                                <td className="py-3 px-3">
                                                                    <span className="font-bold text-gray-900 block">{s.nama}</span>
                                                                    <span className="text-[11px] text-gray-500">NIS: {s.nis} • {s.kelas}</span>
                                                                </td>
                                                                <td className="py-3 px-3">
                                                                    <span className="font-semibold text-gray-800 block">{s.halaqah}</span>
                                                                    <span className="text-[11px] text-gray-500">{s.musyrif}</span>
                                                                </td>
                                                                <td className="py-3 px-3">
                                                                    <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                                                                        {s.totalHafalanJuz} Juz Mutqin
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-3 text-gray-600">
                                                                    {s.targetKhatam || 'Ramadhan 1448 H'}
                                                                </td>
                                                                <td className="py-3 px-3 text-right">
                                                                    <span className="font-bold text-emerald-800 mr-2">
                                                                        {Math.round(((s.totalHafalanJuz || 0) / 30) * 100)}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Rekap Distribusi Halaqah & Quick Actions */}
                                    <div className="space-y-4">
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                                            <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                                <i className="fas fa-sitemap text-emerald-700"></i> Distribusi Kelompok Halaqah
                                            </h4>
                                            <div className="space-y-2.5 text-xs">
                                                {[
                                                    { nama: 'Halaqah Abu Bakar Ash-Shiddiq', musyrif: 'Ustadz Abdullah Mukhtar, S.Pd.I' },
                                                    { nama: 'Halaqah Umar bin Khattab', musyrif: 'Ustadz Ahmad Dahlan, Lc.' },
                                                    { nama: 'Halaqah Utsman bin Affan', musyrif: 'Ustadz Zulkifli, S.Th.I' },
                                                    { nama: 'Halaqah Ali bin Abi Thalib', musyrif: 'Ustadz Hasan Basri, M.Ag' }
                                                ].map((h, i) => {
                                                    const count = santriList.filter(s => s.halaqah.toLowerCase().includes(h.nama.split(' ')[1].toLowerCase())).length;
                                                    return (
                                                        <div key={i} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                                                            <div>
                                                                <span className="font-bold text-gray-900 block">{h.nama}</span>
                                                                <span className="text-[10px] text-gray-500">{h.musyrif}</span>
                                                            </div>
                                                            <span className="bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                                                                {count} Santri
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('halaqah')}
                                                className="mt-3.5 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 rounded-xl transition border border-emerald-200 text-center"
                                            >
                                                Buka Detail Halaqah Lengkap
                                            </button>
                                        </div>

                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200 text-xs">
                                            <span className="font-bold text-amber-900 uppercase text-[10px] block mb-1">
                                                Audit Data &amp; Dokumen
                                            </span>
                                            <h5 className="font-bold text-gray-900 text-sm">Ekspor Rekapitulasi Tahfidz</h5>
                                            <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">
                                                Unduh seluruh rekaman riwayat setoran, status juz, dan nilai tajwid santri dalam format CSV spreadsheet.
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={exportCSV}
                                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                                                >
                                                    <i className="fas fa-download"></i> Ekspor CSV
                                                </button>
                                                <button
                                                    onClick={() => setIsAddSantriOpen(true)}
                                                    className="flex-1 bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300 font-bold py-2 rounded-xl text-xs transition text-center"
                                                >
                                                    + Santri Baru
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* VIEW 2: BERANDA PEMBINAAN DEWAN USTADZ / MUSYRIF         */}
                        {/* ======================================================== */}
                        {isUstadz && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Ustadz Banner */}
                                <div className="bg-gradient-to-r from-blue-900 via-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-blue-800">
                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="bg-blue-400/20 text-blue-200 border border-blue-400/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                                <i className="fas fa-chalkboard-teacher text-blue-300"></i> Ruang Kerja Ustadz Musyrif
                                            </span>
                                            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-emerald-200">
                                                {user?.halaqah || 'Pembina Halaqah Abu Bakar Ash-Shiddiq'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-bold">
                                            Ahlan wa Sahlan, {user?.nama || 'Ustadz Abdullah Mukhtar, S.Pd.I'}!
                                        </h3>
                                        <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                                            Kelola sesi tasmi' harian, verifikasi tajwid &amp; makhorijul huruf santri, otorisasi kelulusan 30 Juz Mutqin, dan berikan persetujuan rencana setoran santri.
                                        </p>
                                    </div>
                                    <div className="absolute right-4 -bottom-6 text-white/5 font-arab text-9xl pointer-events-none select-none">
                                        الأستاذ
                                    </div>
                                </div>

                                {/* Ustadz Metrics */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Santri Binaan</span>
                                            <div className="text-2xl font-bold text-gray-900 mt-1">{santriList.length} <span className="text-xs font-normal text-gray-500">Santri</span></div>
                                            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                                                {santriList.filter(s => s.status === 'Aktif').length} Santri Aktif Setor
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-users"></i>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Antrean Rencana Setoran</span>
                                            <div className="text-2xl font-bold text-amber-600 mt-1">
                                                {rencanaList.filter(r => r.status === 'Diajukan').length} <span className="text-xs font-normal text-gray-500">Pengajuan</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                Menunggu persetujuan Ustadz
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-calendar-alt"></i>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Setoran Tasmi' Diuji</span>
                                            <div className="text-2xl font-bold text-emerald-800 mt-1">
                                                {setoranList.length} <span className="text-xs font-normal text-gray-500">Sesi</span>
                                            </div>
                                            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                                                Tervalidasi di Cloud
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-clipboard-check"></i>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Jurnal Mutaba'ah Masuk</span>
                                            <div className="text-2xl font-bold text-purple-800 mt-1">
                                                {jurnalList.length} <span className="text-xs font-normal text-gray-500">Laporan</span>
                                            </div>
                                            <p className="text-[11px] text-purple-700 font-semibold mt-1">
                                                Deresan Mandiri Santri
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl shadow-inner">
                                            <i className="fas fa-book-reader"></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Rencana Approval & Quick Tasmi' Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Antrean Rencana yang Membutuhkan Approval Ustadz */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                    <i className="fas fa-bell text-amber-500"></i> Pengajuan Target Setoran Menunggu Persetujuan
                                                </h4>
                                                <button onClick={() => setActiveTab('rencana')} className="text-xs text-blue-700 font-bold hover:underline">
                                                    Kelola Semua
                                                </button>
                                            </div>

                                            {rencanaList.filter(r => r.status === 'Diajukan').length === 0 ? (
                                                <div className="p-6 text-center text-gray-400 text-xs bg-gray-50 rounded-xl">
                                                    <i className="fas fa-check-circle text-2xl text-emerald-500 mb-2 block"></i>
                                                    Tidak ada antrean rencana setoran baru yang menunggu persetujuan.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {rencanaList.filter(r => r.status === 'Diajukan').slice(0, 3).map(rcn => {
                                                        const targetS = santriList.find(s => s.id === rcn.santriId);
                                                        return (
                                                            <div key={rcn.id} className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="font-bold text-gray-900">{targetS?.nama || 'Santri'}</span>
                                                                        <span className="text-[11px] text-gray-600 block mt-0.5">
                                                                            Rencana: <strong>{rcn.jenis}</strong> • Surat {rcn.surat} (Ayat {rcn.ayatAwal}-{rcn.ayatAkhir}) Juz {rcn.juz}
                                                                        </span>
                                                                        <span className="text-[10px] text-amber-800 font-semibold block mt-1">
                                                                            Jadwal Target: {rcn.tanggalTarget} ({rcn.waktu})
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleApproveRencana(rcn.id, 'Disetujui Musyrif')}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-2xs flex items-center gap-1"
                                                                    >
                                                                        <i className="fas fa-check"></i> Setujui
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('rencana')}
                                            className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold py-2 rounded-xl transition border border-blue-200 text-center"
                                        >
                                            Buka Panel Approval Rencana Setoran
                                        </button>
                                    </div>

                                    {/* Setoran Terbaru yang Telah Dinilai */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                    <i className="fas fa-history text-emerald-700"></i> Riwayat Ujian Tasmi' Terkini
                                                </h4>
                                                <button onClick={() => setActiveTab('setoran')} className="text-xs text-emerald-700 font-bold hover:underline">
                                                    Lihat Semua
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {setoranList.slice(0, 3).map(rec => (
                                                    <div key={rec.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="font-bold text-gray-900">{rec.santriNama}</span>
                                                                <span className="text-[11px] text-gray-500 block">{rec.tanggal} • {rec.jenis}</span>
                                                            </div>
                                                            <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                                                {rec.nilai}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 font-semibold mt-1">
                                                            Surat {rec.surat} (Ayat {rec.ayatAwal}-{rec.ayatAkhir}) • Juz {rec.juz}
                                                        </p>
                                                        <p className="text-gray-500 italic mt-0.5 text-[11px]">
                                                            "{rec.catatan || 'Lancar dan tartil'}"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setIsAddSetoranOpen(true)}
                                            className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fas fa-plus"></i> Input Setoran Baru Santri
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* VIEW 3: RUANG BELAJAR & HAFALAN PRIBADI SANTRI           */}
                        {/* ======================================================== */}
                        {isSantri && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Santri Personal Hero Banner */}
                                <div className="bg-gradient-to-r from-emerald-800 via-emerald-850 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold">
                                                🌟 {currentSantri?.halaqah || 'Halaqah Abu Bakar Ash-Shiddiq'}
                                            </span>
                                            <span className="bg-amber-400/30 text-amber-200 border border-amber-300/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                                <i className="fas fa-fire text-amber-300"></i> {currentSantri?.streakHari || 14} Hari Istiqomah Belajar
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-bold">
                                            Ahlan wa Sahlan, {currentSantri?.nama || 'Ahmad Fauzan'}!
                                        </h3>
                                        <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                                            Saat ini Anda telah menyelesaikan <strong>{currentSantri?.totalHafalanJuz || 7} Juz Mutqin</strong>. Tetap semangat menambah hafalan baru (ziyadah) dan muroja'ah mandiri setiap selesai shalat berjama'ah.
                                        </p>
                                    </div>
                                    <div className="absolute right-4 -bottom-6 text-white/10 font-arab text-9xl pointer-events-none select-none">
                                        القرآن
                                    </div>
                                </div>

                                {/* Interactive Widget: Penanda Terakhir Baca (Bookmark) & Target Santri */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Bookmark Card */}
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-amber-900 font-bold text-xs uppercase flex items-center gap-1.5">
                                                    <i className="fas fa-bookmark text-amber-600"></i> Penanda Terakhir Dihafal
                                                </span>
                                                <button 
                                                    onClick={() => setIsBookmarkModalOpen(true)}
                                                    className="text-amber-700 hover:text-amber-900 text-xs font-bold underline"
                                                >
                                                    Ubah
                                                </button>
                                            </div>
                                            <div className="text-xl font-bold text-gray-900 mt-1">
                                                Surat {currentSantri?.lastReadBookmark?.surat || "Al-A'raf"}
                                            </div>
                                            <p className="text-xs text-amber-900 font-semibold mt-0.5">
                                                Ayat {currentSantri?.lastReadBookmark?.ayat || 45} • Juz {currentSantri?.lastReadBookmark?.juz || 8}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                Diperbarui: {currentSantri?.lastReadBookmark?.tanggal || 'Hari ini'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsAddJurnalOpen(true)}
                                            className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                            <i className="fas fa-arrow-right"></i> Lanjutkan Hafalan Ini
                                        </button>
                                    </div>

                                    {/* Target & Estimasi Khatam */}
                                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                                        <div>
                                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                                                Target Khatam 30 Juz
                                            </span>
                                            <div className="text-xl font-bold text-emerald-800 mt-1">
                                                {currentSantri?.targetKhatam || 'Ramadhan 1448 H'}
                                            </div>
                                            <div className="mt-2 space-y-1 text-xs text-gray-600">
                                                <div className="flex justify-between">
                                                    <span>Target harian:</span>
                                                    <span className="font-bold text-gray-800">{currentSantri?.targetHalamanPerHari || 1} Halaman/hari</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Sisa yang harus dihafal:</span>
                                                    <span className="font-bold text-amber-600">{30 - (currentSantri?.totalHafalanJuz || 7)} Juz</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('hafalan')}
                                            className="mt-4 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 rounded-xl transition border border-emerald-200 text-center"
                                        >
                                            Buka Peta 30 Juz Anda
                                        </button>
                                    </div>

                                    {/* Belajar Mandiri Stats */}
                                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                                        <div>
                                            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                                                Aktivitas Belajar Mandiri
                                            </span>
                                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                                {totalMenitBelajar} <span className="text-xs font-normal text-gray-500">Menit Tercatat</span>
                                            </div>
                                            <p className="text-xs text-emerald-700 font-medium mt-1">
                                                <i className="fas fa-check-circle mr-1"></i> {totalSesiBelajar} Sesi Ziyadah &amp; Muroja'ah
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('jurnal')}
                                            className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-xl transition shadow-xs text-center"
                                        >
                                            Buka Catatan Jurnal Belajar
                                        </button>
                                    </div>
                                </div>

                                {/* Overall Progress Bar */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <h4 className="font-bold text-gray-800 text-sm">
                                            Kemajuan Menuju Khatam 30 Juz
                                        </h4>
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                            {currentSantri?.totalHafalanJuz || 7} dari 30 Juz Selesai ({Math.round(((currentSantri?.totalHafalanJuz || 7) / 30) * 100)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-200">
                                        <div 
                                            className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.round(((currentSantri?.totalHafalanJuz || 7) / 30) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-3 flex justify-between text-[11px] text-gray-500">
                                        <span>Juz 1 (Mulai)</span>
                                        <span>Juz 15 (Pertengahan)</span>
                                        <span>Juz 30 (Khotmil Qur'an)</span>
                                    </div>
                                </div>

                                {/* Recent Activity Grid: Catatan Jurnal & Riwayat Setoran */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Jurnal Belajar Terbaru */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                    <i className="fas fa-book-reader text-emerald-700"></i> Catatan Belajar Terkini
                                                </h4>
                                                <button onClick={() => setActiveTab('jurnal')} className="text-xs text-emerald-700 font-bold hover:underline">
                                                    Lihat Semua
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {santriJurnals.slice(0, 3).map(jrn => (
                                                    <div key={jrn.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="font-bold text-gray-900">{jrn.kegiatan}</span>
                                                                <span className="text-gray-500 block text-[11px]">{jrn.tanggal} • {jrn.durasiMenit} Menit</span>
                                                            </div>
                                                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                {jrn.tingkatKelancaran}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 font-semibold mt-1">
                                                            Surat {jrn.surat} (Ayat {jrn.ayatAwal}-{jrn.ayatAkhir}) • Juz {jrn.juz}
                                                        </p>
                                                        {jrn.catatanAyatSulit && (
                                                            <p className="text-gray-500 italic mt-0.5 text-[11px]">
                                                                "{jrn.catatanAyatSulit}"
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsAddJurnalOpen(true)}
                                            className="mt-4 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 rounded-xl transition border border-emerald-200 flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fas fa-plus"></i> Tambah Catatan Belajar Baru
                                        </button>
                                    </div>

                                    {/* Setoran Resmi dari Ustadz */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                    <i className="fas fa-certificate text-amber-600"></i> Evaluasi Ustadz Pembina
                                                </h4>
                                                <button onClick={() => setActiveTab('setoran')} className="text-xs text-emerald-700 font-bold hover:underline">
                                                    Lihat Semua
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {filteredSetoran.slice(0, 3).map(item => (
                                                    <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="font-bold text-gray-900">{item.jenis}</span>
                                                                <span className="text-gray-500 block text-[11px]">{item.tanggal} • Musyrif: {item.musyrif}</span>
                                                            </div>
                                                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                {item.nilai}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 font-semibold mt-1">
                                                            Surat {item.surat} (Ayat {item.ayatAwal}-{item.ayatAkhir}) • Juz {item.juz}
                                                        </p>
                                                        <p className="text-gray-600 italic mt-0.5 text-[11px] bg-white p-1.5 rounded border border-gray-100">
                                                            "{item.catatan}"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('rencana')}
                                            className="mt-4 w-full bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold py-2 rounded-xl transition border border-teal-200 flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fas fa-calendar-alt"></i> Lihat Jadwal &amp; Rencana Setoran
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: JURNAL BELAJAR & MUTABA'AH MANDIRI */}
                {activeTab === 'jurnal' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {isSantri ? "Mutaba'ah Yaumiyah Mandiri" : "Panel Monitoring Musyrif & Admin"}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-1">
                                    {isSantri ? "Jurnal Belajar & Muroja'ah Harian" : "Monitoring Mutaba'ah Mandiri Santri"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isSantri 
                                        ? "Catat setiap aktivitas ziyadah, muroja'ah mandiri, atau simakan bersama teman agar progres belajar terpantau rapi."
                                        : "Pantau waktu belajar mandiri, istiqomah deres Al-Qur'an, dan kendala ayat mutasyabihat santri binaan."}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {!isSantri && (
                                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 text-xs">
                                        <span className="font-bold text-gray-600 pl-1">Santri:</span>
                                        <select
                                            value={jurnalFilterSantriId}
                                            onChange={(e) => setJurnalFilterSantriId(e.target.value)}
                                            className="bg-white border border-gray-300 text-xs font-semibold rounded-lg px-2.5 py-1 text-gray-800 outline-none"
                                        >
                                            <option value="Semua">Semua Santri ({jurnalList.length} Jurnal)</option>
                                            {santriList.map(s => (
                                                <option key={s.id} value={s.id}>{s.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {isSantri && (
                                    <button
                                        onClick={() => setIsAddJurnalOpen(true)}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
                                    >
                                        <i className="fas fa-pen-fancy"></i>
                                        <span>Tulis Jurnal Belajar Baru</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Journal List */}
                        <div className="space-y-3">
                            {displayedJurnals.length === 0 ? (
                                <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-500">
                                    <i className="fas fa-feather-alt text-4xl text-gray-300 mb-2"></i>
                                    <p className="font-semibold">Belum ada catatan jurnal belajar.</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {isSantri ? "Mulai catat ziyadah dan muroja'ah mandiri Anda hari ini." : "Belum ada santri yang mencatat jurnal belajar pada kriteria ini."}
                                    </p>
                                </div>
                            ) : (
                                displayedJurnals.map(jrn => {
                                    const student = santriList.find(s => s.id === jrn.santriId);
                                    return (
                                        <div key={jrn.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-300 transition">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                        jrn.kegiatan === 'Ziyadah Mandiri' ? 'bg-emerald-100 text-emerald-800' :
                                                        jrn.kegiatan === "Muroja'ah Mandiri" ? 'bg-blue-100 text-blue-800' :
                                                        jrn.kegiatan === 'Talaqqi Simakan' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        <i className={`fas ${
                                                            jrn.kegiatan === 'Ziyadah Mandiri' ? 'fa-plus' :
                                                            jrn.kegiatan === "Muroja'ah Mandiri" ? 'fa-redo' :
                                                            jrn.kegiatan === 'Talaqqi Simakan' ? 'fa-user-friends' :
                                                            'fa-spell-check'
                                                        }`}></i>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-gray-900 text-sm">{jrn.kegiatan}</h4>
                                                            {!isSantri && student && (
                                                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                    {student.nama} ({student.halaqah})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Tanggal: {jrn.tanggal} • Durasi: {jrn.durasiMenit} Menit
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        jrn.tingkatKelancaran === 'Sangat Lancar' ? 'bg-emerald-100 text-emerald-800' :
                                                        jrn.tingkatKelancaran === 'Cukup Lancar' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {jrn.tingkatKelancaran}
                                                    </span>

                                                    {/* Musyrif / Admin Action: Beri Bimbingan Langsung */}
                                                    {(!isSantri || isAdmin) && (
                                                        <button
                                                            onClick={() => handleOpenBimbinganJurnal(jrn)}
                                                            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                                                            title="Beri bimbingan / evaluasi langsung untuk santri"
                                                        >
                                                            <i className="fas fa-comment-dots text-emerald-600"></i>
                                                            <span className="hidden sm:inline">{jrn.catatanMusyrif ? 'Ubah Bimbingan' : 'Beri Bimbingan'}</span>
                                                        </button>
                                                    )}

                                                    {(isSantri || isAdmin) && (
                                                        <div className="flex items-center gap-1.5 ml-1">
                                                            <button
                                                                onClick={() => handleOpenEditJurnal(jrn)}
                                                                className="text-gray-500 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 p-1.5 rounded-lg transition"
                                                                title="Edit Catatan Jurnal"
                                                            >
                                                                <i className="fas fa-edit text-xs"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteJurnalTarget(jrn)}
                                                                className="text-gray-500 hover:text-red-700 bg-gray-100 hover:bg-red-50 p-1.5 rounded-lg transition"
                                                                title="Hapus Jurnal"
                                                            >
                                                                <i className="fas fa-trash-alt text-xs"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-gray-500">Ayat yang Dipelajari:</span>
                                                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                                                        Surat {jrn.surat} ({jrn.ayatAwal} s/d {jrn.ayatAkhir}) • Juz {jrn.juz}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Catatan Kesulitan / Ayat Mutasyabihat:</span>
                                                    <p className="italic text-gray-700 bg-gray-50 p-2.5 rounded-lg mt-0.5 border border-gray-100">
                                                        "{jrn.catatanAyatSulit || 'Tidak ada kesulitan, muroja\'ah lancar'}"
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Kartu Bimbingan & Paraf Musyrif */}
                                            {jrn.catatanMusyrif && (
                                                <div className="mt-3 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs">
                                                    <div className="flex items-center justify-between text-emerald-900 font-bold mb-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <i className="fas fa-check-circle text-emerald-600"></i>
                                                            <span>Bimbingan &amp; Paraf Musyrif:</span>
                                                        </span>
                                                        <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">
                                                            {jrn.parafMusyrif || 'Ustadz Pembina'}
                                                        </span>
                                                    </div>
                                                    <p className="italic text-emerald-800">"{jrn.catatanMusyrif}"</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: RENCANA & JADWAL SETORAN */}
                {activeTab === 'rencana' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {isSantri ? "Koordinasi dengan Musyrif" : "Panel Otorisasi Jadwal Tasmi' Dewan Ustadz"}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-1">
                                    {isSantri ? "Rencana & Jadwal Setoran Saya" : "Verifikasi & Approval Rencana Setoran"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isSantri 
                                        ? "Ajukan rencana setoran (Ziyadah/Muroja'ah) yang sudah Anda matangkan di asrama untuk disimak Ustadz."
                                        : "Tinjau pengajuan jadwal setoran para santri, verifikasi kesiapan materi, dan berikan persetujuan waktu tasmi'."}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {!isSantri && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200 text-xs">
                                            <span className="font-bold text-gray-600 pl-1">Status:</span>
                                            {(['Semua', 'Diajukan', 'Disetujui Musyrif', 'Selesai Disetorkan'] as const).map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => setRencanaFilterStatus(st)}
                                                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                                                        rencanaFilterStatus === st
                                                            ? 'bg-teal-700 text-white shadow-2xs'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                                >
                                                    {st === 'Disetujui Musyrif' ? 'Disetujui' : st === 'Selesai Disetorkan' ? 'Selesai' : st}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200 text-xs">
                                            <span className="font-bold text-gray-600 pl-1">Santri:</span>
                                            <select
                                                value={rencanaFilterSantriId}
                                                onChange={(e) => setRencanaFilterSantriId(e.target.value)}
                                                className="bg-white border border-gray-300 text-xs font-semibold rounded-lg px-2 py-1 text-gray-800 outline-none"
                                            >
                                                <option value="Semua">Semua Santri</option>
                                                {santriList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nama}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {isSantri && (
                                    <button
                                        onClick={() => setIsAddRencanaOpen(true)}
                                        className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
                                    >
                                        <i className="fas fa-calendar-plus"></i>
                                        <span>Ajukan Jadwal Setoran</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {santriRencana.length === 0 ? (
                                <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-500">
                                    <i className="fas fa-calendar-times text-4xl text-gray-300 mb-2"></i>
                                    <p className="font-semibold">Belum ada antrean rencana setoran yang sesuai filter.</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {isSantri ? "Klik tombol 'Ajukan Jadwal Setoran' untuk menentukan jadwal tasmi' Anda." : "Santri belum mengajukan rencana baru."}
                                    </p>
                                </div>
                            ) : (
                                santriRencana.map(rcn => {
                                    const student = santriList.find(s => s.id === rcn.santriId);
                                    return (
                                        <div key={rcn.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-teal-300 transition">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                        rcn.status === 'Disetujui Musyrif' ? 'bg-emerald-100 text-emerald-800' :
                                                        rcn.status === 'Selesai Disetorkan' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        <i className={`fas ${
                                                            rcn.status === 'Disetujui Musyrif' ? 'fa-check' :
                                                            rcn.status === 'Selesai Disetorkan' ? 'fa-check-double' :
                                                            'fa-clock'
                                                        }`}></i>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-gray-900 text-sm">Target: {rcn.tanggalTarget} ({rcn.waktu})</h4>
                                                            {!isSantri && student && (
                                                                <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                    {student.nama} ({student.halaqah})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Jenis: <strong>{rcn.jenis}</strong> • Surat {rcn.surat} ({rcn.ayatAwal}-{rcn.ayatAkhir}) Juz {rcn.juz}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        rcn.status === 'Disetujui Musyrif' ? 'bg-emerald-100 text-emerald-800' :
                                                        rcn.status === 'Selesai Disetorkan' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {rcn.status}
                                                    </span>
                                                    {(isSantri || isAdmin) && (
                                                        <div className="flex items-center gap-1.5 ml-1">
                                                            <button
                                                                onClick={() => handleOpenEditRencana(rcn)}
                                                                className="text-gray-500 hover:text-teal-700 bg-gray-100 hover:bg-teal-50 p-1.5 rounded-lg transition"
                                                                title="Edit Rencana Target"
                                                            >
                                                                <i className="fas fa-edit text-xs"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteRencanaTarget(rcn)}
                                                                className="text-gray-500 hover:text-red-700 bg-gray-100 hover:bg-red-50 p-1.5 rounded-lg transition"
                                                                title="Batalkan Rencana"
                                                            >
                                                                <i className="fas fa-trash-alt text-xs"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                <p className="text-gray-600 italic">
                                                    Catatan santri: "{rcn.catatanSantri || 'Siap disetorkan'}"
                                                </p>

                                                {(isAdmin || isUstadz) && (
                                                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                                                        {rcn.status === 'Diajukan' && (
                                                            <button
                                                                onClick={() => handleApproveRencana(rcn.id, 'Disetujui Musyrif')}
                                                                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                                                            >
                                                                <i className="fas fa-check"></i> Setujui Jadwal
                                                            </button>
                                                        )}
                                                        {rcn.status !== 'Selesai Disetorkan' && (
                                                            <button
                                                                onClick={() => handleStartSetoranFromRencana(rcn)}
                                                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                                                                title="Langsung mulai uji hafalan santri sesuai rencana ini"
                                                            >
                                                                <i className="fas fa-microphone-alt"></i> Uji &amp; Nilai Tasmi' Sekarang
                                                            </button>
                                                        )}
                                                        {rcn.status === 'Disetujui Musyrif' && (
                                                            <button
                                                                onClick={() => handleApproveRencana(rcn.id, 'Selesai Disetorkan')}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                                                            >
                                                                <i className="fas fa-check-double"></i> Tandai Selesai
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: MODUL 30 JUZ AL-QUR'AN */}
                {activeTab === 'hafalan' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                                <div>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Modul Khusus Mutaba'ah Tahfidz
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                                        <span>Progres 30 Juz Al-Qur'an</span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Klik pada salah satu kotak Juz untuk melihat pokok kandungan surat, riwayat setoran, serta mengupdate kelulusan ujian tasmi'.
                                    </p>
                                </div>

                                {!isSantri && (
                                    <div className="flex items-center gap-2 self-start lg:self-auto bg-gray-50 p-2 rounded-xl border border-gray-200">
                                        <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Pilih Santri:</label>
                                        <select
                                            value={selectedJuzSantriId}
                                            onChange={(e) => setSelectedJuzSantriId(e.target.value)}
                                            className="bg-white border border-gray-300 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                                        >
                                            {santriList.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.nama} ({s.totalHafalanJuz} Juz Mutqin)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Santri Card Detail */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-emerald-950 text-white p-5 rounded-2xl relative overflow-hidden shadow-md">
                                <div className="md:col-span-2 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-emerald-800 border-2 border-emerald-400 flex items-center justify-center text-xl font-bold">
                                            {activeJuzSantri?.nama ? activeJuzSantri.nama.charAt(0) : 'S'}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white">{activeJuzSantri?.nama}</h4>
                                            <p className="text-xs text-emerald-200">
                                                NIS: {activeJuzSantri?.nis} • {activeJuzSantri?.kelas}
                                            </p>
                                            <p className="text-[11px] text-emerald-300 mt-0.5">
                                                Musyrif: {activeJuzSantri?.musyrif} ({activeJuzSantri?.halaqah})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center relative z-10">
                                    <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold">Capaian Mutqin</span>
                                    <div className="text-2xl font-bold text-amber-300 mt-0.5">
                                        {totalMutqin} <span className="text-sm font-normal text-white">/ 30 Juz</span>
                                    </div>
                                    <span className="text-[11px] text-emerald-200">{percentageComplete}% Menuju Khotmil Qur'an</span>
                                </div>

                                <div className="flex flex-col justify-center relative z-10">
                                    <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold">Hafalan Terakhir</span>
                                    <div className="text-lg font-bold text-white mt-0.5 truncate">
                                        {activeJuzSantri?.suratTerakhir || 'Juz ' + (totalMutqin + 1)}
                                    </div>
                                    <span className="text-[11px] text-amber-300">
                                        {30 - totalMutqin} Juz tersisa
                                    </span>
                                </div>

                                <div className="absolute -right-6 -bottom-8 text-white/5 font-arab text-9xl pointer-events-none select-none">
                                    ختم
                                </div>
                            </div>

                            {/* Overall Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-1.5">
                                    <span>Kemajuan Keseluruhan 30 Juz:</span>
                                    <span className="text-emerald-700 font-bold">{totalMutqin} dari 30 Juz Telah Mutqin ({percentageComplete}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${percentageComplete}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Status Legend & View Toggle */}
                            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-bold text-gray-700">Filter Status:</span>
                                    <button
                                        onClick={() => setJuzFilterStatus('Semua')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                            juzFilterStatus === 'Semua' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        Semua (30)
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus('Mutqin')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === 'Mutqin' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Mutqin ({totalMutqin})
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus('Sedang Berjalan')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === 'Sedang Berjalan' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Sedang Berjalan ({totalSedangBerjalan})
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus("Perlu Muroja'ah")}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === "Perlu Muroja'ah" ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Perlu Muroja'ah ({totalPerluMurojaah})
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus('Belum')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === 'Belum' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Belum ({totalBelum})
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenRaport(activeJuzSantri)}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
                                        title="Cetak Transkrip & Syahadah Resmi Capaian Santri Ini"
                                    >
                                        <i className="fa-solid fa-certificate"></i>
                                        <span>Cetak Raport / Syahadah</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTools('kalkulator')}
                                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
                                        title="Simulasi Target Khatam 30 Juz"
                                    >
                                        <i className="fa-solid fa-calculator text-amber-300"></i>
                                        <span>Simulasi Khatam</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTools('audio')}
                                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
                                        title="Dengarkan Murattal Al-Qur'an 30 Juz"
                                    >
                                        <i className="fa-solid fa-headphones text-teal-200"></i>
                                        <span>Murattal Tilawah</span>
                                    </button>

                                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 ml-auto">
                                        <button
                                            onClick={() => setJuzViewMode('grid')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                                                juzViewMode === 'grid' ? 'bg-white shadow-xs text-emerald-800' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            <i className="fas fa-th-large"></i> Grid 30 Juz
                                        </button>
                                        <button
                                            onClick={() => setJuzViewMode('table')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                                                juzViewMode === 'table' ? 'bg-white shadow-xs text-emerald-800' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            <i className="fas fa-list"></i> Tabel Rekap
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODE: GRID 30 JUZ */}
                        {juzViewMode === 'grid' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
                                {JUZ_METADATA.map((meta) => {
                                    const progress = activeJuzProgressMap[meta.juz] || {
                                        juz: meta.juz,
                                        status: meta.juz <= (activeJuzSantri?.totalHafalanJuz || 0) ? 'Mutqin' : 'Belum'
                                    };

                                    if (juzFilterStatus !== 'Semua' && progress.status !== juzFilterStatus) {
                                        return null;
                                    }

                                    const isMutqin = progress.status === 'Mutqin';
                                    const isSedangBerjalan = progress.status === 'Sedang Berjalan';
                                    const isPerluMurojaah = progress.status === "Perlu Muroja'ah";

                                    return (
                                        <div
                                            key={meta.juz}
                                            onClick={() => handleOpenJuzModal(meta.juz)}
                                            className={`rounded-2xl p-4 border text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden flex flex-col justify-between ${
                                                isMutqin
                                                    ? 'bg-gradient-to-br from-emerald-700 to-teal-800 text-white border-emerald-600 shadow-sm'
                                                    : isSedangBerjalan
                                                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 text-gray-900 border-amber-300 ring-2 ring-amber-400 shadow-md'
                                                    : isPerluMurojaah
                                                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900 border-blue-300 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        isMutqin 
                                                            ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40' 
                                                            : isSedangBerjalan
                                                            ? 'bg-amber-200 text-amber-900 font-extrabold'
                                                            : isPerluMurojaah
                                                            ? 'bg-blue-200 text-blue-900 font-extrabold'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        JUZ {meta.juz}
                                                    </span>

                                                    {isMutqin && (
                                                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                                                            <i className="fas fa-check"></i>
                                                        </span>
                                                    )}
                                                    {isSedangBerjalan && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                                                    )}
                                                </div>

                                                <h4 className={`font-arab text-xl font-bold mt-2 ${isMutqin ? 'text-amber-200' : 'text-gray-800'}`}>
                                                    {meta.namaArab}
                                                </h4>
                                                <p className={`text-xs font-bold leading-tight ${isMutqin ? 'text-white' : 'text-gray-900'}`}>
                                                    {meta.namaLatin}
                                                </p>
                                                <p className={`text-[10px] mt-1 leading-snug line-clamp-2 ${isMutqin ? 'text-emerald-100' : 'text-gray-500'}`}>
                                                    {meta.rentangSurat}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px]">
                                                <span className={`font-bold ${
                                                    isMutqin ? 'text-emerald-200' :
                                                    isSedangBerjalan ? 'text-amber-800' :
                                                    isPerluMurojaah ? 'text-blue-800' :
                                                    'text-gray-400'
                                                }`}>
                                                    {progress.status}
                                                </span>
                                                {progress.nilaiTasmi && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                                        isMutqin ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                                                    }`}>
                                                        {progress.nilaiTasmi.split(' ')[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* MODE: TABEL REKAPITULASI 30 JUZ */}
                        {juzViewMode === 'table' && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs">
                                    <span className="font-bold text-gray-700">Tabel Rincian Capaian Mutaba'ah Juz 1 s/d 30</span>
                                    <span className="text-gray-500">Klik baris untuk melihat detail atau mengubah status ujian tasmi'</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-700 uppercase font-semibold">
                                                <th className="py-3 px-4">Juz</th>
                                                <th className="py-3 px-4">Nama Juz</th>
                                                <th className="py-3 px-4">Cakupan Surat</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">Nilai Tasmi'</th>
                                                <th className="py-3 px-4">Tanggal Ujian</th>
                                                <th className="py-3 px-4">Penguji</th>
                                                <th className="py-3 px-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {JUZ_METADATA.map((meta) => {
                                                const progress = activeJuzProgressMap[meta.juz] || {
                                                    juz: meta.juz,
                                                    status: meta.juz <= (activeJuzSantri?.totalHafalanJuz || 0) ? 'Mutqin' : 'Belum'
                                                };

                                                if (juzFilterStatus !== 'Semua' && progress.status !== juzFilterStatus) {
                                                    return null;
                                                }

                                                return (
                                                    <tr 
                                                        key={meta.juz}
                                                        onClick={() => handleOpenJuzModal(meta.juz)}
                                                        className="hover:bg-emerald-50/60 cursor-pointer transition"
                                                    >
                                                        <td className="py-3 px-4 font-bold text-emerald-800">Juz {meta.juz}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="font-arab text-base text-gray-800 mr-2 font-bold">{meta.namaArab}</span>
                                                            <span className="text-gray-600 font-medium">({meta.namaLatin})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">{meta.rentangSurat}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                progress.status === 'Mutqin' ? 'bg-emerald-100 text-emerald-800' :
                                                                progress.status === 'Sedang Berjalan' ? 'bg-amber-100 text-amber-800' :
                                                                progress.status === "Perlu Muroja'ah" ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {progress.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                                            {progress.nilaiTasmi || '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500">
                                                            {progress.tanggalUjian || '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            {progress.penguji || '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenJuzModal(meta.juz);
                                                                }}
                                                                className="text-emerald-700 hover:text-emerald-900 font-bold"
                                                            >
                                                                <i className="fas fa-eye mr-1"></i> Detail
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: DATA SANTRI (Admin / Ustadz) */}
                {activeTab === 'santri' && (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {isAdmin ? "Administrator Master Santri (CRUD)" : "Dewan Musyrif / Pembina Halaqah"}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-1">
                                    {isAdmin ? "Kelola Master Data Santri" : "Daftar Santri Halaqah Binaan"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isAdmin 
                                        ? "Pendaftaran santri baru, update data induk, pemindahan halaqah, mutasi status (Aktif/Izin/Mutakharij), dan penghapusan data."
                                        : "Pantau capaian hafalan santri binaan, input ujian setoran tasmi', dan perbarui profil capaian juz santri."}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 font-medium">
                                    Total: <strong>{filteredSantri.length}</strong> santri
                                </span>
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsAddSantriOpen(true)}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                                    >
                                        <i className="fas fa-plus"></i> Tambah Santri Baru
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search and Status Filters */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input
                                    type="text"
                                    placeholder="Cari santri berdasarkan Nama, NIS, atau Halaqah..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
                                <span className="text-[11px] font-bold text-gray-500 px-1.5">Status:</span>
                                {(['Semua', 'Aktif', 'Izin', 'Mutakharij'] as const).map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setFilterSantriStatus(st)}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                            filterSantriStatus === st
                                                ? 'bg-emerald-700 text-white shadow-2xs'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSantri.map((santri) => (
                                <div key={santri.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                        NIS: {santri.nis}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                        santri.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
                                                        santri.status === 'Izin' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {santri.status || 'Aktif'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm mt-1.5">{santri.nama}</h4>
                                                <p className="text-xs text-gray-500">{santri.kelas}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-emerald-800">{santri.totalHafalanJuz} <span className="text-xs font-normal">Juz</span></div>
                                                <span className="text-[10px] text-gray-400">Total Hafalan</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs space-y-1.5">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Halaqah:</span>
                                                <span className="font-semibold text-gray-800">{santri.halaqah}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Musyrif:</span>
                                                <span className="font-semibold text-gray-800">{santri.musyrif}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Target Khatam:</span>
                                                <span className="font-semibold text-amber-700">{santri.targetKhatam || 'Ramadhan 1448 H'}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Surat Terakhir:</span>
                                                <span className="font-semibold text-emerald-700">{santri.suratTerakhir}</span>
                                            </div>
                                        </div>

                                        {/* Progress bar to 30 Juz */}
                                        <div className="mt-3">
                                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                <span>Target 30 Juz</span>
                                                <span className="font-bold">{Math.round((santri.totalHafalanJuz / 30) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-emerald-600 h-full rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (santri.totalHafalanJuz / 30) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedJuzSantriId(santri.id);
                                                    setActiveTab('hafalan');
                                                }}
                                                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold py-2 rounded-xl border border-amber-200 transition flex items-center justify-center gap-1.5"
                                            >
                                                <i className="fas fa-book-quran text-amber-700"></i>
                                                <span>Peta 30 Juz</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedSantriId(santri.id);
                                                    setIsAddSetoranOpen(true);
                                                }}
                                                className="px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs rounded-xl border border-emerald-200"
                                                title="Input Setoran Resmi"
                                            >
                                                <i className="fas fa-plus"></i> Setor
                                            </button>
                                        </div>

                                        {(isAdmin || isUstadz) && (
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => handleOpenRaport(santri)}
                                                    className="px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold py-1.5 rounded-xl border border-amber-200 transition flex items-center justify-center gap-1"
                                                    title="Cetak Transkrip & Syahadah Capaian Santri"
                                                >
                                                    <i className="fa-solid fa-certificate text-amber-600"></i>
                                                    <span>Raport</span>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditSantri(santri)}
                                                    className="flex-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 text-xs font-semibold py-1.5 rounded-xl border border-gray-200 transition flex items-center justify-center gap-1"
                                                >
                                                    <i className="fas fa-edit text-xs"></i> Edit Profil
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setDeleteSantriTarget(santri)}
                                                        className="px-3 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-500 text-xs font-semibold py-1.5 rounded-xl border border-gray-200 transition"
                                                        title="Hapus Data Santri"
                                                    >
                                                        <i className="fas fa-trash-alt text-xs"></i>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 6: SETORAN HAFALAN RESMI */}
                {activeTab === 'setoran' && (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {isSantri ? "Riwayat Nilai Resmi" : isUstadz ? "Sesi Ujian Tasmi' Musyrif" : "Audit & Rekapitulasi Pesantren"}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-1">
                                    {isSantri ? "Riwayat Evaluasi Nilai Tasmi' Santri" : isUstadz ? "Input & Verifikasi Setoran Santri" : "Audit & Rekapitulasi Setoran"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isSantri 
                                        ? "Catatan evaluasi nilai tajwid, fashohah, dan makhorijul huruf langsung dari Dewan Ustadz."
                                        : "Data rekaman ujian tasmi' harian (Ziyadah & Muroja'ah) yang telah tervalidasi di Google Cloud."}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-600">Jenis:</span>
                                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
                                        {(['Semua', 'Ziyadah', "Muroja'ah"] as const).map(jenis => (
                                            <button
                                                key={jenis}
                                                onClick={() => setFilterJenis(jenis)}
                                                className={`px-3 py-1 rounded-md font-medium transition ${
                                                    filterJenis === jenis ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                {jenis}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {!isSantri && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-600">Santri:</span>
                                        <select
                                            value={filterSantriId}
                                            onChange={(e) => setFilterSantriId(e.target.value)}
                                            className="border border-gray-300 p-1.5 rounded-lg text-xs outline-none bg-white"
                                        >
                                            <option value="Semua">Semua Santri</option>
                                            {santriList.map(s => (
                                                <option key={s.id} value={s.id}>{s.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={exportCSV}
                                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                    >
                                        <i className="fas fa-file-csv text-emerald-600"></i> Ekspor CSV
                                    </button>
                                    {(isAdmin || isUstadz) && (
                                        <button
                                            onClick={() => setIsAddSetoranOpen(true)}
                                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                                        >
                                            <i className="fas fa-plus"></i> Setoran Baru
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredSetoran.length === 0 ? (
                                <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-500">
                                    <i className="fas fa-book-open text-4xl text-gray-300 mb-2"></i>
                                    <p className="font-semibold">Belum ada catatan setoran resmi yang sesuai filter.</p>
                                </div>
                            ) : (
                                filteredSetoran.map(record => (
                                    <div key={record.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-200 transition">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                    record.jenis === 'Ziyadah' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    <i className={`fas ${record.jenis === 'Ziyadah' ? 'fa-plus' : 'fa-redo'}`}></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">{record.santriNama}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        Tanggal: {record.tanggal} • Musyrif: {record.musyrif}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    record.jenis === 'Ziyadah' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {record.jenis}
                                                </span>
                                                <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    {record.nilai}
                                                </span>
                                                {(isAdmin || isUstadz) && (
                                                    <div className="flex items-center gap-1.5 ml-1">
                                                        <button
                                                            onClick={() => handleOpenEditSetoran(record)}
                                                            className="text-gray-500 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 p-1.5 rounded-lg transition"
                                                            title="Edit Catatan Setoran"
                                                        >
                                                            <i className="fas fa-edit text-xs"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteSetoranTarget(record)}
                                                            className="text-gray-500 hover:text-red-700 bg-gray-100 hover:bg-red-50 p-1.5 rounded-lg transition"
                                                            title="Hapus Catatan Setoran"
                                                        >
                                                            <i className="fas fa-trash-alt text-xs"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-500">Materi Setoran:</span>
                                                <p className="font-bold text-gray-800 text-sm mt-0.5">
                                                    Surat {record.surat} (Ayat {record.ayatAwal} s/d {record.ayatAkhir}) • Juz {record.juz}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Catatan &amp; Evaluasi Musyrif:</span>
                                                <p className="italic text-gray-700 bg-gray-50 p-2.5 rounded-lg mt-0.5 border border-gray-100">
                                                    "{record.catatan || 'Lancar tanpa catatan khusus'}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: MANAJEMEN HALAQAH & DEWAN ASATIDZ (ADMIN) */}
                {activeTab === 'halaqah' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Struktur Lembaga Pesantren
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                                    <i className="fas fa-mosque text-emerald-700"></i>
                                    <span>Manajemen Halaqah &amp; Dewan Asatidz</span>
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Distribusi kelompok belajar tahfidz, penugasan musyrif pembina, alokasi santri, dan monitoring capaian per halaqah.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddSantriOpen(true)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition self-start md:self-auto"
                            >
                                <i className="fas fa-user-plus"></i> Tambah Santri ke Halaqah
                            </button>
                        </div>

                        {/* Halaqah Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    nama: 'Halaqah Abu Bakar Ash-Shiddiq',
                                    musyrif: 'Ustadz Abdullah Mukhtar, S.Pd.I',
                                    jadwal: "Ba'da Subuh & Ba'da Ashar",
                                    lokasi: "Sayap Timur Masjid Jami'",
                                    color: 'emerald',
                                    icon: 'fa-shield-halved'
                                },
                                {
                                    nama: 'Halaqah Umar bin Khattab',
                                    musyrif: 'Ustadz Muhammad Yusuf, Lc.',
                                    jadwal: "Ba'da Maghrib & Ba'da Isya",
                                    lokasi: "Ruang Tahfidz Lt. 2",
                                    color: 'blue',
                                    icon: 'fa-landmark'
                                },
                                {
                                    nama: 'Halaqah Utsman bin Affan',
                                    musyrif: 'Ustadz Ahmad Zaki, Al-Hafidz',
                                    jadwal: "Ba'da Subuh & Ba'da Ashar",
                                    lokasi: "Serambi Masjid Jami'",
                                    color: 'purple',
                                    icon: 'fa-book-open-reader'
                                },
                                {
                                    nama: 'Halaqah Ali bin Abi Thalib',
                                    musyrif: 'Ustadz Ridwan Hakim, M.Pd.',
                                    jadwal: "Ba'da Maghrib & Ba'da Isya",
                                    lokasi: "Gazebo Tahfidz Asrama",
                                    color: 'amber',
                                    icon: 'fa-star-and-crescent'
                                }
                            ].map((hq, idx) => {
                                const members = santriList.filter(s => s.halaqah.toLowerCase().includes(hq.nama.toLowerCase().replace('halaqah ', '')) || s.halaqah === hq.nama);
                                const totalJuzInHq = members.reduce((acc, curr) => acc + (curr.totalHafalanJuz || 0), 0);
                                const avgJuzInHq = members.length > 0 ? (totalJuzInHq / members.length).toFixed(1) : '0';

                                return (
                                    <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                                        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                                        Kelompok Tahfidz {idx + 1}
                                                    </span>
                                                    <h4 className="text-base font-bold text-gray-900 mt-1">{hq.nama}</h4>
                                                    <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                                                        <i className="fas fa-chalkboard-teacher text-emerald-700"></i>
                                                        <span>Musyrif: <strong>{hq.musyrif}</strong></span>
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg border border-emerald-100">
                                                    <i className={`fas ${hq.icon}`}></i>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                                                <div>
                                                    <span className="text-gray-400 block font-semibold">Waktu Sesi:</span>
                                                    <span className="font-medium text-gray-800">{hq.jadwal}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block font-semibold">Lokasi Halaqah:</span>
                                                    <span className="font-medium text-gray-800">{hq.lokasi}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Santri List in Halaqah */}
                                        <div className="p-5 space-y-3 flex-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-gray-700">Daftar Santri Binaan ({members.length} Santri):</span>
                                                <span className="text-emerald-700 font-semibold text-[11px]">Rata-rata: {avgJuzInHq} Juz</span>
                                            </div>

                                            {members.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                                                    Belum ada santri yang dialokasikan ke halaqah ini.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {members.map(s => (
                                                        <div key={s.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs flex justify-between items-center hover:bg-emerald-50/40 transition">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[11px]">
                                                                    {s.nama.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900">{s.nama}</div>
                                                                    <div className="text-[10px] text-gray-500">NIS: {s.nis} • {s.status}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                                                    {s.totalHafalanJuz} Juz
                                                                </span>
                                                                <button
                                                                    onClick={() => handleOpenEditSantri(s)}
                                                                    className="text-gray-400 hover:text-emerald-700 p-1"
                                                                    title="Mutasi / Edit Santri"
                                                                >
                                                                    <i className="fas fa-exchange-alt text-[11px]"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setActiveTab('santri');
                                                    setSearchQuery(hq.nama.replace('Halaqah ', ''));
                                                }}
                                                className="flex-1 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold py-2 rounded-xl border border-gray-200 transition text-center shadow-2xs"
                                            >
                                                Lihat di Data Santri
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (members[0]) {
                                                        setSelectedJuzSantriId(members[0].id);
                                                    }
                                                    setActiveTab('hafalan');
                                                }}
                                                className="px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-xl transition shadow-2xs"
                                            >
                                                Buka Peta 30 Juz
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 7: PENGATURAN & BACKEND */}
                {activeTab === 'pengaturan' && (
                    <div className="max-w-3xl space-y-6">
                        {/* Firebase Cloud Database Card */}
                        <div className="bg-gradient-to-br from-white to-emerald-50/50 p-6 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center text-lg">
                                        <i className="fas fa-fire"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                            Firebase Cloud Database
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                Aktif &amp; Terintegrasi
                                            </span>
                                        </h3>
                                        <p className="text-[11px] text-gray-500">Google Cloud Firestore • Spark Plan (Gratis)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs shadow-2xs">
                                    <span className={`w-2.5 h-2.5 rounded-full ${firebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                    <span className="font-semibold text-gray-700">
                                        {firebaseConnected ? 'Terhubung Real-Time' : 'Sinkronisasi Aktif'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                Database cloud Firebase Firestore telah terpasang dan aktif secara otomatis. Setiap setoran, jurnal belajar mandiri, dan data santri langsung disinkronkan secara <em>real-time</em> ke server Google Cloud dengan proteksi keamanan <em>Firestore Rules</em>.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <div className="bg-white p-3 rounded-xl border border-gray-200">
                                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Proyek Firebase</span>
                                    <span className="font-mono text-gray-800 text-[11px] font-semibold truncate block">gen-lang-client-0788779463</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-gray-200">
                                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Kapasitas Paket</span>
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                        <i className="fas fa-check-circle text-xs"></i> Spark Free Tier
                                    </span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-gray-200">
                                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Fitur Data</span>
                                    <span className="text-blue-700 font-semibold flex items-center gap-1">
                                        <i className="fas fa-sync-alt text-xs"></i> Real-time Listeners
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 mb-2">
                                <i className="fas fa-network-wired text-emerald-700"></i> Integrasi Tambahan: Google Apps Script / Sheets
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                Selain Firebase, aplikasi ini juga dapat dihubungkan ke <strong>Google Sheets</strong> menggunakan Google Apps Script Web App jika Anda menginginkan salinan data di spreadsheet:
                            </p>

                            {urlSavedMessage && (
                                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                                    <i className="fas fa-check-circle"></i>
                                    <span>{urlSavedMessage}</span>
                                </div>
                            )}

                            {testConnectionStatus && (
                                <div className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                                    testConnectionStatus.loading 
                                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                        : testConnectionStatus.success
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                    <i className={`fas ${
                                        testConnectionStatus.loading ? 'fa-spinner fa-spin' :
                                        testConnectionStatus.success ? 'fa-check-circle' : 'fa-exclamation-triangle'
                                    }`}></i>
                                    <span>{testConnectionStatus.message || 'Menguji koneksi ke Google Apps Script...'}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        URL Web App Google Apps Script (/exec)
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="https://script.google.com/macros/s/.../exec"
                                        value={inputUrl}
                                        onChange={(e) => setInputUrl(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 outline-none"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Pastikan deployment Web App diatur dengan: <strong>Execute as: Me</strong> dan <strong>Who has access: Anyone</strong>.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (setApiUrl) setApiUrl(inputUrl.trim());
                                            localStorage.setItem('darul_kamal_api_url', inputUrl.trim());
                                            setUrlSavedMessage('URL Google Apps Script berhasil disimpan!');
                                            setTimeout(() => setUrlSavedMessage(''), 3000);
                                        }}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                                    >
                                        Simpan Perubahan URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleTestBackend}
                                        disabled={testConnectionStatus?.loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                                    >
                                        <i className="fas fa-bolt"></i> Uji Koneksi API
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInputUrl('');
                                            if (setApiUrl) setApiUrl('');
                                            localStorage.removeItem('darul_kamal_api_url');
                                            setUrlSavedMessage('Kembali ke Mode Offline Lokal.');
                                            setTimeout(() => setUrlSavedMessage(''), 3000);
                                        }}
                                        className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-semibold transition"
                                    >
                                        Reset ke Offline
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Reset Local Data Option */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h4 className="font-bold text-gray-800 text-sm mb-1 text-red-600 flex items-center gap-2">
                                <i className="fas fa-trash-alt"></i> Reset Data Aplikasi Lokal
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">
                                Jika ingin mengembalikan data santri, setoran, jurnal belajar, dan peta 30 juz ke data contoh bawaan:
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsResetModalOpen(true)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <i className="fas fa-undo"></i>
                                <span>Reset Semua Data ke Bawaan</span>
                            </button>

                            {resetSuccessMessage && (
                                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs mt-3 flex items-center gap-2">
                                    <i className="fas fa-check-circle text-emerald-600"></i>
                                    <span>{resetSuccessMessage}</span>
                                </div>
                            )}
                        </div>

                        {/* Panduan Code.gs */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                                <i className="fas fa-code text-blue-600"></i> Contoh Kode Google Apps Script (Code.gs)
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">
                                Salin skrip di bawah ini ke editor Google Apps Script di spreadsheet Anda:
                            </p>
                            <pre className="bg-gray-900 text-gray-200 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-56">
                                {GOOGLE_SCRIPT_SAMPLE_CODE}
                            </pre>
                        </div>
                    </div>
                )}

                {/* TAB 9: KELAS TAHFIDZ & MATA PELAJARAN */}
                {activeTab === 'kelas_mapel' && (
                    <KelasMapelModule 
                        isAdmin={isAdmin}
                        isUstadz={isUstadz}
                        isSantri={isSantri}
                        user={user}
                        currentSantri={currentSantri}
                        santriList={santriList}
                        kelasList={kelasList}
                        setKelasList={setKelasList}
                        mapelList={mapelList}
                        setMapelList={setMapelList}
                        onOpenSetoranForSantri={(santriId) => {
                            setSelectedSantriId(santriId);
                            setIsAddSetoranOpen(true);
                        }}
                        onNavigateTab={(tab) => setActiveTab(tab)}
                    />
                )}
            </main>

            {/* MODAL 1: TULIS JURNAL BELAJAR MANDIRI (SANTRI) */}
            {isAddJurnalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                    <i className="fas fa-pen-nib text-emerald-700"></i> Catat Jurnal Belajar Mandiri
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Santri: <strong>{currentSantri?.nama}</strong>
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsAddJurnalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveJurnal} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Aktivitas</label>
                                    <select
                                        value={jurnalKegiatan}
                                        onChange={(e) => setJurnalKegiatan(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Ziyadah Mandiri">Ziyadah Mandiri (Hafalan Baru)</option>
                                        <option value="Muroja'ah Mandiri">Muroja'ah Mandiri</option>
                                        <option value="Talaqqi Simakan">Talaqqi Simakan Bersama Teman</option>
                                        <option value="Kajian Tajwid & Makhorij">Kajian Tajwid &amp; Makhorij</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Durasi Belajar (Menit)</label>
                                    <input 
                                        type="number"
                                        min="5"
                                        max="240"
                                        value={jurnalDurasi}
                                        onChange={(e) => setJurnalDurasi(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Surat Al-Qur'an</label>
                                <select
                                    value={jurnalSurahNomor}
                                    onChange={(e) => {
                                        const num = parseInt(e.target.value);
                                        setJurnalSurahNomor(num);
                                        const s = QURAN_SURAHS.find(q => q.nomor === num);
                                        if (s) {
                                            setJurnalJuz(String(s.juz));
                                            setJurnalAyatAwal('1');
                                            setJurnalAyatAkhir(String(Math.min(s.ayat, 20)));
                                        }
                                    }}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} ayat, Juz {s.juz})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Awal</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={jurnalAyatAwal}
                                        onChange={(e) => setJurnalAyatAwal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Akhir</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={jurnalAyatAkhir}
                                        onChange={(e) => setJurnalAyatAkhir(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Juz</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={jurnalJuz}
                                        onChange={(e) => setJurnalJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Tingkat Kelancaran Mandiri</label>
                                <select
                                    value={jurnalKelancaran}
                                    onChange={(e) => setJurnalKelancaran(e.target.value as any)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    <option value="Sangat Lancar">Sangat Lancar (Tanpa terbata / lupa)</option>
                                    <option value="Cukup Lancar">Cukup Lancar (Lupa 1-2 kata)</option>
                                    <option value="Masih Terbata">Masih Terbata (Perlu pengulangan lagi)</option>
                                    <option value="Butuh Pendampingan">Butuh Pendampingan Teman / Musyrif</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Ayat Sulit / Mutasyabihat</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Contoh: Ayat 35 ada kemiripan dengan Surat Al-Baqarah, waqaf di kata..."
                                    value={jurnalCatatanSulit}
                                    onChange={(e) => setJurnalCatatanSulit(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddJurnalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Catatan Belajar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: AJUKAN RENCANA SETORAN KE MUSYRIF */}
            {isAddRencanaOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                    <i className="fas fa-calendar-check text-teal-700"></i> Ajukan Jadwal Setoran ke Musyrif
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Musyrif Pembina: <strong>{currentSantri?.musyrif}</strong>
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsAddRencanaOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveRencana} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tanggal Rencana</label>
                                    <input 
                                        type="date"
                                        value={rencanaTanggal}
                                        onChange={(e) => setRencanaTanggal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Waktu Sesi</label>
                                    <select
                                        value={rencanaWaktu}
                                        onChange={(e) => setRencanaWaktu(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Ba'da Subuh">Ba'da Subuh</option>
                                        <option value="Ba'da Ashar">Ba'da Ashar</option>
                                        <option value="Ba'da Maghrib">Ba'da Maghrib</option>
                                        <option value="Ba'da Isya">Ba'da Isya</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Setoran</label>
                                    <select
                                        value={rencanaJenis}
                                        onChange={(e) => setRencanaJenis(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                                        <option value="Muroja'ah">Muroja'ah (Pengulangan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Surat Al-Qur'an</label>
                                    <select
                                        value={rencanaSurahNomor}
                                        onChange={(e) => {
                                            const num = parseInt(e.target.value);
                                            setRencanaSurahNomor(num);
                                            const s = QURAN_SURAHS.find(q => q.nomor === num);
                                            if (s) {
                                                setRencanaJuz(String(s.juz));
                                                setRencanaAyatAwal('1');
                                                setRencanaAyatAkhir(String(Math.min(s.ayat, 20)));
                                            }
                                        }}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        {QURAN_SURAHS.map(s => (
                                            <option key={s.nomor} value={s.nomor}>
                                                {s.nomor}. {s.nama} (Juz {s.juz})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Awal</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={rencanaAyatAwal}
                                        onChange={(e) => setRencanaAyatAwal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Akhir</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={rencanaAyatAkhir}
                                        onChange={(e) => setRencanaAyatAkhir(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Juz</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={rencanaJuz}
                                        onChange={(e) => setRencanaJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pesan / Kesiapan untuk Ustadz</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Contoh: Sudah diulang 15x lancar di kamar, insyaAllah siap setor tasmi'..."
                                    value={rencanaCatatan}
                                    onChange={(e) => setRencanaCatatan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddRencanaOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Ajukan ke Ustadz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: UBAH PENANDA TERAKHIR BACA (BOOKMARK) */}
            {isBookmarkModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <i className="fas fa-bookmark text-amber-600"></i> Atur Penanda Terakhir Baca
                            </h3>
                            <button 
                                onClick={() => setIsBookmarkModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveBookmark} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Surat Al-Qur'an</label>
                                <select
                                    value={bmSurahNomor}
                                    onChange={(e) => setBmSurahNomor(parseInt(e.target.value))}
                                    className="w-full border border-gray-300 p-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} ayat, Juz {s.juz})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Sampai Ayat Ke-</label>
                                <input 
                                    type="number"
                                    min="1"
                                    value={bmAyat}
                                    onChange={(e) => setBmAyat(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsBookmarkModalOpen(false)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs"
                                >
                                    Simpan Penanda
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: DETAIL & EVALUASI JUZ 30 */}
            {activeJuzModal !== null && activeMeta && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-start pb-3 border-b border-gray-200 mb-4">
                            <div>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    Juz {activeMeta.juz} • {activeMeta.rentangSurat}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <h3 className="font-arab text-2xl font-bold text-emerald-900">{activeMeta.namaArab}</h3>
                                    <span className="font-bold text-gray-800 text-base">({activeMeta.namaLatin})</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Santri: <strong>{activeJuzSantri?.nama}</strong> (NIS: {activeJuzSantri?.nis})
                                </p>
                            </div>
                            <button 
                                onClick={() => setActiveJuzModal(null)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Deskripsi Kandungan Juz */}
                        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 mb-4 leading-relaxed">
                            <span className="font-bold flex items-center gap-1.5 mb-1">
                                <i className="fas fa-info-circle text-emerald-700"></i> Pokok Kandungan Juz {activeMeta.juz}:
                            </span>
                            <p>{activeMeta.deskripsi}</p>
                        </div>

                        {/* Riwayat Setoran Khusus Juz Ini */}
                        <div className="mb-4">
                            <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <i className="fas fa-history text-gray-500"></i> Riwayat Setoran Santri di Juz Ini:
                            </h4>
                            {modalJuzSetoran.length === 0 ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    Belum ada catatan setoran resmi untuk Juz {activeMeta.juz} pada santri ini.
                                </p>
                            ) : (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {modalJuzSetoran.map(item => (
                                        <div key={item.id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-gray-800">{item.surat} ({item.ayatAwal}-{item.ayatAkhir})</span>
                                                <span className="text-gray-500 text-[11px] block">{item.tanggal} • {item.jenis}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    {item.nilai}
                                                </span>
                                                <span className="text-[10px] text-gray-500 block">{item.musyrif}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Form Update Kelulusan / Status Juz */}
                        <form onSubmit={handleSaveJuzProgress} className="space-y-3 pt-3 border-t border-gray-200 text-xs">
                            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                                <i className="fas fa-certificate text-amber-600"></i> Evaluasi &amp; Status Kelulusan Juz:
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Status Juz</label>
                                    <select 
                                        value={modalJuzStatus}
                                        onChange={(e) => setModalJuzStatus(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                        disabled={isSantri}
                                    >
                                        <option value="Mutqin">Mutqin (Lulus Tasmi')</option>
                                        <option value="Sedang Berjalan">Sedang Berjalan (Ziyadah Aktif)</option>
                                        <option value="Perlu Muroja'ah">Perlu Muroja'ah Ulang</option>
                                        <option value="Belum">Belum Dimulai</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nilai Ujian Tasmi'</label>
                                    <select 
                                        value={modalJuzNilai}
                                        onChange={(e) => setModalJuzNilai(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                        disabled={isSantri || modalJuzStatus !== 'Mutqin'}
                                    >
                                        <option value="A (Mumtaz)">A (Mumtaz / Sempurna)</option>
                                        <option value="B (Jayyid Jiddan)">B (Jayyid Jiddan / Baik Sekali)</option>
                                        <option value="C (Jayyid)">C (Jayyid / Baik)</option>
                                        <option value="D (Maqbul)">D (Maqbul / Cukup)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tanggal Ujian Tasmi'</label>
                                    <input 
                                        type="date"
                                        value={modalJuzTanggal}
                                        onChange={(e) => setModalJuzTanggal(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        disabled={isSantri || modalJuzStatus !== 'Mutqin'}
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ustadz Penguji</label>
                                    <input 
                                        type="text"
                                        value={modalJuzPenguji}
                                        onChange={(e) => setModalJuzPenguji(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        disabled={isSantri}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Evaluasi / Ayat Mutasyabihat</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Contoh: Sangat fasih, hati-hati ayat mutasyabihat di pertengahan surat..."
                                    value={modalJuzCatatan}
                                    onChange={(e) => setModalJuzCatatan(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    disabled={isSantri}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setActiveJuzModal(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Tutup
                                </button>
                                {!isSantri && (
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                    >
                                        Simpan Perubahan Juz
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: INPUT SETORAN RESMI MUSYRIF */}
            {isAddSetoranOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <i className="fas fa-book-reader text-emerald-700"></i> Input Setoran Hafalan Santri
                            </h3>
                            <button 
                                onClick={() => setIsAddSetoranOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveSetoran} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pilih Santri</label>
                                <select 
                                    value={selectedSantriId}
                                    onChange={(e) => setSelectedSantriId(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    {santriList.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.nis} - {s.nama} ({s.halaqah})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Setoran</label>
                                    <select 
                                        value={formJenis}
                                        onChange={(e) => setFormJenis(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                    >
                                        <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                                        <option value="Muroja'ah">Muroja'ah (Pengulangan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Juz</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="30"
                                        value={formJuz}
                                        onChange={(e) => setFormJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Surat Al-Qur'an</label>
                                <select
                                    value={selectedSurahNomor}
                                    onChange={(e) => handleSurahChange(parseInt(e.target.value))}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} ayat, Juz {s.juz})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Awal</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={formAyatAwal}
                                        onChange={(e) => setFormAyatAwal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Akhir</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={formAyatAkhir}
                                        onChange={(e) => setFormAyatAkhir(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nilai / Predikat</label>
                                <select 
                                    value={formNilai}
                                    onChange={(e) => setFormNilai(e.target.value as any)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    <option value="A (Mumtaz)">A (Mumtaz / Sempurna)</option>
                                    <option value="B (Jayyid Jiddan)">B (Jayyid Jiddan / Baik Sekali)</option>
                                    <option value="C (Jayyid)">C (Jayyid / Baik)</option>
                                    <option value="D (Maqbul)">D (Maqbul / Cukup)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Tajwid / Makhorijul Huruf</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Catatan dari musyrif untuk evaluasi santri..."
                                    value={formCatatan}
                                    onChange={(e) => setFormCatatan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSetoranOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Setoran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: PENDAFTARAN SANTRI BARU (ADMIN) */}
            {isAddSantriOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <i className="fas fa-user-plus text-emerald-700"></i> Pendaftaran Santri Baru
                            </h3>
                            <button 
                                onClick={() => setIsAddSantriOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveSantri} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nomor Induk Santri (NIS)</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: 12351"
                                    value={newNis}
                                    onChange={(e) => setNewNis(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Lengkap Santri</label>
                                <input 
                                    type="text" 
                                    placeholder="Nama lengkap santri..."
                                    value={newNama}
                                    onChange={(e) => setNewNama(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kelas</label>
                                    <input 
                                        type="text" 
                                        value={newKelas}
                                        onChange={(e) => setNewKelas(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Hafalan Awal (Juz)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="30"
                                        value={newTotalJuz}
                                        onChange={(e) => setNewTotalJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Kelompok Halaqah</label>
                                <select 
                                    value={newHalaqah}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewHalaqah(val);
                                        if (HALAQAH_MUSYRIF_MAP[val]) {
                                            setNewMusyrif(HALAQAH_MUSYRIF_MAP[val]);
                                        }
                                    }}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    {Object.keys(HALAQAH_MUSYRIF_MAP).map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Status Santri</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Izin">Izin</option>
                                        <option value="Mutakharij">Mutakharij</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ustadz Pembina</label>
                                    <input 
                                        type="text" 
                                        value={newMusyrif}
                                        onChange={(e) => setNewMusyrif(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSantriOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Daftarkan Santri
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: KONFIRMASI RESET DATA */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-exclamation-triangle text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">
                            Konfirmasi Reset Data
                        </h3>
                        <p className="text-center text-xs text-gray-600 leading-relaxed mb-5">
                            Apakah Anda yakin ingin mengembalikan seluruh data santri, setoran, jurnal mandiri, dan progres 30 juz ke data awal bawaan pesantren?
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsResetModalOpen(false)}
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteReset}
                                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                Ya, Reset Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 8: EDIT PROFIL SANTRI (ADMIN / USTADZ) */}
            {isEditSantriOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-user-edit text-emerald-700"></i> Edit Data Santri
                            </h3>
                            <button 
                                onClick={() => setIsEditSantriOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSantri} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nomor Induk (NIS)</label>
                                    <input 
                                        type="text" 
                                        value={editNis}
                                        onChange={(e) => setEditNis(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Status Santri</label>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Izin">Izin</option>
                                        <option value="Mutakharij">Mutakharij (Lulus)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Lengkap Santri</label>
                                <input 
                                    type="text" 
                                    value={editNama}
                                    onChange={(e) => setEditNama(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kelas</label>
                                    <input 
                                        type="text" 
                                        value={editKelas}
                                        onChange={(e) => setEditKelas(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Total Hafalan Mutqin (Juz)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="30"
                                        value={editTotalJuz}
                                        onChange={(e) => setEditTotalJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Kelompok Halaqah (Mutasi Halaqah)</label>
                                <select 
                                    value={editHalaqah}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setEditHalaqah(val);
                                        if (HALAQAH_MUSYRIF_MAP[val]) {
                                            setEditMusyrif(HALAQAH_MUSYRIF_MAP[val]);
                                        }
                                    }}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    {Object.keys(HALAQAH_MUSYRIF_MAP).map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Ustadz Musyrif Pembina</label>
                                <input 
                                    type="text" 
                                    value={editMusyrif}
                                    onChange={(e) => setEditMusyrif(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Target Khatam</label>
                                <input 
                                    type="text" 
                                    value={editTargetKhatam}
                                    onChange={(e) => setEditTargetKhatam(e.target.value)}
                                    placeholder="Contoh: Ramadhan 1448 H"
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditSantriOpen(false)}
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

            {/* MODAL 9: KONFIRMASI HAPUS SANTRI (ADMIN) */}
            {deleteSantriTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-user-times text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">
                            Hapus Data Santri
                        </h3>
                        <p className="text-center text-xs text-gray-600 leading-relaxed mb-5">
                            Apakah Anda yakin ingin menghapus data santri <strong>{deleteSantriTarget.nama}</strong> (NIS: {deleteSantriTarget.nis})? Tindakan ini akan menghapus data dari sistem dan database cloud.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteSantriTarget(null)}
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteSantri}
                                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                Ya, Hapus Santri
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 10: EDIT SETORAN RESMI (USTADZ / ADMIN) */}
            {isEditSetoranOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <i className="fas fa-edit text-emerald-700"></i> Edit Catatan Setoran Resmi
                            </h3>
                            <button 
                                onClick={() => setIsEditSetoranOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSetoran} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Santri</label>
                                <select 
                                    value={editSetoranSantriId}
                                    onChange={(e) => setEditSetoranSantriId(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    {santriList.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.nis} - {s.nama} ({s.halaqah})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Setoran</label>
                                    <select 
                                        value={editSetoranJenis}
                                        onChange={(e) => setEditSetoranJenis(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                                        <option value="Muroja'ah">Muroja'ah (Pengulangan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Juz</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="30"
                                        value={editSetoranJuz}
                                        onChange={(e) => setEditSetoranJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Surat Al-Qur'an</label>
                                <select
                                    value={editSetoranSurahNomor}
                                    onChange={(e) => {
                                        const num = parseInt(e.target.value);
                                        setEditSetoranSurahNomor(num);
                                        const surah = QURAN_SURAHS.find(s => s.nomor === num);
                                        if (surah) {
                                            setEditSetoranJuz(String(surah.juz));
                                        }
                                    }}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} ayat, Juz {s.juz})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Awal</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={editSetoranAyatAwal}
                                        onChange={(e) => setEditSetoranAyatAwal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Akhir</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={editSetoranAyatAkhir}
                                        onChange={(e) => setEditSetoranAyatAkhir(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nilai / Predikat</label>
                                <select 
                                    value={editSetoranNilai}
                                    onChange={(e) => setEditSetoranNilai(e.target.value as any)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    <option value="A (Mumtaz)">A (Mumtaz / Sempurna)</option>
                                    <option value="B (Jayyid Jiddan)">B (Jayyid Jiddan / Baik Sekali)</option>
                                    <option value="C (Jayyid)">C (Jayyid / Baik)</option>
                                    <option value="D (Maqbul)">D (Maqbul / Cukup)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Tajwid / Makhorijul Huruf</label>
                                <textarea 
                                    rows={3}
                                    value={editSetoranCatatan}
                                    onChange={(e) => setEditSetoranCatatan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditSetoranOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Perbarui Setoran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 11: KONFIRMASI HAPUS SETORAN */}
            {deleteSetoranTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-trash-alt text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">
                            Hapus Catatan Setoran
                        </h3>
                        <p className="text-center text-xs text-gray-600 leading-relaxed mb-5">
                            Apakah Anda yakin ingin menghapus catatan setoran <strong>Surat {deleteSetoranTarget.surat} ({deleteSetoranTarget.ayatAwal}-{deleteSetoranTarget.ayatAkhir})</strong> milik <strong>{deleteSetoranTarget.santriNama}</strong>?
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteSetoranTarget(null)}
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteSetoran}
                                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                Ya, Hapus Setoran
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 12: EDIT JURNAL BELAJAR SANTRI */}
            {isEditJurnalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-pen-fancy text-emerald-700"></i> Edit Jurnal Belajar Mandiri
                            </h3>
                            <button 
                                onClick={() => setIsEditJurnalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateJurnal} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Jenis Aktivitas Belajar</label>
                                <select 
                                    value={editJurnalKegiatan}
                                    onChange={(e) => setEditJurnalKegiatan(e.target.value as any)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    <option value="Ziyadah Mandiri">Ziyadah Mandiri (Menghafal Baru)</option>
                                    <option value="Muroja'ah Mandiri">Muroja'ah Mandiri (Mengulang)</option>
                                    <option value="Talaqqi Simakan">Talaqqi Simakan (Bersama Teman)</option>
                                    <option value="Kajian Tajwid & Makhorij">Kajian Tajwid &amp; Makhorij</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Surat Al-Qur'an</label>
                                <select
                                    value={editJurnalSurahNomor}
                                    onChange={(e) => {
                                        const num = parseInt(e.target.value);
                                        setEditJurnalSurahNomor(num);
                                        const surah = QURAN_SURAHS.find(s => s.nomor === num);
                                        if (surah) {
                                            setEditJurnalJuz(String(surah.juz));
                                        }
                                    }}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} ayat, Juz {s.juz})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Awal</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={editJurnalAyatAwal}
                                        onChange={(e) => setEditJurnalAyatAwal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Akhir</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={editJurnalAyatAkhir}
                                        onChange={(e) => setEditJurnalAyatAkhir(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Juz</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max="30"
                                        value={editJurnalJuz}
                                        onChange={(e) => setEditJurnalJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Durasi Belajar (Menit)</label>
                                    <input 
                                        type="number" 
                                        min="5"
                                        step="5"
                                        value={editJurnalDurasi}
                                        onChange={(e) => setEditJurnalDurasi(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tingkat Kelancaran</label>
                                    <select 
                                        value={editJurnalKelancaran}
                                        onChange={(e) => setEditJurnalKelancaran(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="Sangat Lancar">Sangat Lancar</option>
                                        <option value="Cukup Lancar">Cukup Lancar</option>
                                        <option value="Masih Terbata">Masih Terbata</option>
                                        <option value="Butuh Pendampingan">Butuh Pendampingan</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Kesulitan / Ayat Mutasyabihat</label>
                                <textarea 
                                    rows={2}
                                    value={editJurnalCatatanSulit}
                                    onChange={(e) => setEditJurnalCatatanSulit(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditJurnalOpen(false)}
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

            {/* MODAL 13: KONFIRMASI HAPUS JURNAL */}
            {deleteJurnalTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-trash-alt text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">
                            Hapus Catatan Jurnal
                        </h3>
                        <p className="text-center text-xs text-gray-600 leading-relaxed mb-5">
                            Apakah Anda yakin ingin menghapus catatan aktivitas <strong>{deleteJurnalTarget.kegiatan}</strong> (Surat {deleteJurnalTarget.surat}) pada {deleteJurnalTarget.tanggal}?
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteJurnalTarget(null)}
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteJurnal}
                                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                Ya, Hapus Jurnal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 14: EDIT RENCANA SETORAN (SANTRI) */}
            {isEditRencanaOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-calendar-alt text-teal-700"></i> Edit Rencana Target Setoran
                            </h3>
                            <button 
                                onClick={() => setIsEditRencanaOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRencana} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tanggal Target</label>
                                    <input 
                                        type="date"
                                        value={editRencanaTanggal}
                                        onChange={(e) => setEditRencanaTanggal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Sesi Waktu Halaqah</label>
                                    <select 
                                        value={editRencanaWaktu}
                                        onChange={(e) => setEditRencanaWaktu(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 bg-white"
                                    >
                                        <option value="Ba'da Subuh">Ba'da Subuh</option>
                                        <option value="Ba'da Ashar">Ba'da Ashar</option>
                                        <option value="Ba'da Maghrib">Ba'da Maghrib</option>
                                        <option value="Ba'da Isya">Ba'da Isya</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Materi</label>
                                    <select 
                                        value={editRencanaJenis}
                                        onChange={(e) => setEditRencanaJenis(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 bg-white"
                                    >
                                        <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                                        <option value="Muroja'ah">Muroja'ah (Pengulangan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Juz</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max="30"
                                        value={editRencanaJuz}
                                        onChange={(e) => setEditRencanaJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Surat Al-Qur'an</label>
                                <select
                                    value={editRencanaSurahNomor}
                                    onChange={(e) => {
                                        const num = parseInt(e.target.value);
                                        setEditRencanaSurahNomor(num);
                                        const surah = QURAN_SURAHS.find(s => s.nomor === num);
                                        if (surah) {
                                            setEditRencanaJuz(String(surah.juz));
                                        }
                                    }}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} ayat, Juz {s.juz})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Awal</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={editRencanaAyatAwal}
                                        onChange={(e) => setEditRencanaAyatAwal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Akhir</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={editRencanaAyatAkhir}
                                        onChange={(e) => setEditRencanaAyatAkhir(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pesan / Kesiapan untuk Ustadz</label>
                                <textarea 
                                    rows={2}
                                    value={editRencanaCatatan}
                                    onChange={(e) => setEditRencanaCatatan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditRencanaOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Perbarui Rencana
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 15: KONFIRMASI BATALKAN RENCANA SETORAN */}
            {deleteRencanaTarget && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-calendar-times text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">
                            Batalkan Rencana Setoran
                        </h3>
                        <p className="text-center text-xs text-gray-600 leading-relaxed mb-5">
                            Apakah Anda yakin ingin membatalkan target setoran <strong>Surat {deleteRencanaTarget.surat} ({deleteRencanaTarget.ayatAwal}-{deleteRencanaTarget.ayatAkhir})</strong> pada {deleteRencanaTarget.tanggalTarget}?
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteRencanaTarget(null)}
                                className="flex-1 py-2.5 px-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
                            >
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteRencana}
                                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                Ya, Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL 16: INPUT EVALUASI & BIMBINGAN JURNAL BELAJAR OLEH MUSYRIF */}
            {isBimbinganJurnalOpen && bimbinganTargetJurnal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up border border-gray-100">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <i className="fas fa-comment-dots text-emerald-700"></i> Bimbingan &amp; Evaluasi Musyrif
                            </h3>
                            <button 
                                onClick={() => setIsBimbinganJurnalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs mb-3 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Santri:</span>
                                <span className="font-bold text-gray-800">
                                    {santriList.find(s => s.id === bimbinganTargetJurnal.santriId)?.nama || 'Santri'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Materi Belajar:</span>
                                <span className="font-semibold text-gray-700">
                                    Surat {bimbinganTargetJurnal.surat} ({bimbinganTargetJurnal.ayatAwal}-{bimbinganTargetJurnal.ayatAkhir}) Juz {bimbinganTargetJurnal.juz}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Catatan Santri:</span>
                                <span className="italic text-gray-600">
                                    "{bimbinganTargetJurnal.catatanAyatSulit || 'Tidak ada catatan khusus'}"
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSaveBimbinganJurnal} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">
                                    Catatan Nasehat, Bimbingan Tajwid, &amp; Arahan Muroja'ah
                                </label>
                                <textarea 
                                    rows={4}
                                    placeholder="Tuliskan masukan untuk santri, misal: 'Tingkatkan simakan talaqqi di ayat 45-50 karena ada waqaf lazim dan idgham bighunnah...'"
                                    value={bimbinganText}
                                    onChange={(e) => setBimbinganText(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsBimbinganJurnalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Bimbingan &amp; Beri Paraf
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL RAPORT & SYAHADAH TAHFIDZ RESMI */}
            <RaportSyahadahModal
                isOpen={isRaportModalOpen}
                onClose={() => setIsRaportModalOpen(false)}
                santri={raportTargetSantri}
                setoranList={setoranList}
                kelasList={kelasList}
            />

            {/* MODAL UTILITAS CERDAS (ESTIMATOR KHATAM, MURATTAL AUDIO, BACKUP/RESTORE) */}
            <TahfidzToolsModal
                isOpen={isToolsModalOpen}
                onClose={() => setIsToolsModalOpen(false)}
                initialTab={toolsInitialTab}
                currentSantri={currentSantri}
                allSantri={santriList}
                allSetoran={setoranList}
                allJurnal={jurnalList}
                allRencana={rencanaList}
                allKelas={kelasList}
                allMapel={mapelList}
                onRestoreData={handleRestoreData}
            />
        </div>
    );
};