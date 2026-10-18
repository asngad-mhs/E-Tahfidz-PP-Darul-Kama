import { Santri, SetoranRecord, User, JuzProgressRecord } from './types';

export interface QuranSurah {
    nomor: number;
    nama: string;
    ayat: number;
    juz: number;
}

export interface JuzMeta {
    juz: number;
    namaArab: string;
    namaLatin: string;
    rentangSurat: string;
    totalSurat: number;
    deskripsi: string;
}

export const JUZ_METADATA: JuzMeta[] = [
    { juz: 1, namaArab: "الم", namaLatin: "Alif Lam Mim", rentangSurat: "Al-Fatihah 1 s/d Al-Baqarah 141", totalSurat: 2, deskripsi: "Pembukaan Al-Qur'an, kisah penciptaan Nabi Adam AS, Bani Israil, dan pembangunan Ka'bah oleh Nabi Ibrahim AS." },
    { juz: 2, namaArab: "سَيَقُولُ", namaLatin: "Sayaqulu", rentangSurat: "Al-Baqarah 142 s/d Al-Baqarah 252", totalSurat: 1, deskripsi: "Pengalihan kiblat ke Ka'bah, syariat puasa Ramadhan, haji, qishash, dan perjuangan Thalut melawan Jalut." },
    { juz: 3, namaArab: "تِلْكَ الرُّسُلُ", namaLatin: "Tilkar Rusul", rentangSurat: "Al-Baqarah 253 s/d Ali 'Imran 92", totalSurat: 2, deskripsi: "Ayat Kursi yang agung, larangan riba, doa pamungkas Al-Baqarah, serta kemuliaan keluarga Imran." },
    { juz: 4, namaArab: "لَنْ تَنَالُوا", namaLatin: "Lan Tanalu", rentangSurat: "Ali 'Imran 93 s/d An-Nisa' 23", totalSurat: 2, deskripsi: "Hikmah dan ketabahan Perang Uhud, syahid, hukum waris dasar, dan wanita-wanita yang mahram dinikahi." },
    { juz: 5, namaArab: "وَالْمُحْصَنَاتُ", namaLatin: "Wal Muhshanat", rentangSurat: "An-Nisa' 24 s/d An-Nisa' 147", totalSurat: 1, deskripsi: "Hukum pernikahan, kepemimpinan suami dalam keluarga, ketaatan kepada Ulil Amri, dan shalat khauf." },
    { juz: 6, namaArab: "لَا يُحِبُّ اللَّهُ", namaLatin: "La Yuhibbullah", rentangSurat: "An-Nisa' 148 s/d Al-Ma'idah 81", totalSurat: 2, deskripsi: "Penegasan tentang Nabi Isa AS, syariat wudhu & tayamum, makanan halal, serta kisah dua putra Nabi Adam." },
    { juz: 7, namaArab: "وَإِذَا سَمِعُوا", namaLatin: "Wa Iza Sami'u", rentangSurat: "Al-Ma'idah 82 s/d Al-An'am 110", totalSurat: 2, deskripsi: "Kafarat sumpah, pengharaman khamr & judi, tauhid Rububiyah, dan dialog dakwah tauhid Nabi Ibrahim AS." },
    { juz: 8, namaArab: "وَلَوْ أَنَّنَا", namaLatin: "Wa Lau Annana", rentangSurat: "Al-An'am 111 s/d Al-A'raf 87", totalSurat: 2, deskripsi: "10 Wasiat agung Al-An'am, keangkuhan Iblis menolak sujud, penghuni Al-A'raf, serta dakwah Nabi Hud dan Shalih." },
    { juz: 9, namaArab: "قَالَ الْمَلَأُ", namaLatin: "Qalal Mala'u", rentangSurat: "Al-A'raf 88 s/d Al-Anfal 40", totalSurat: 2, deskripsi: "Dakwah Nabi Syu'aib, mu'jizat tongkat Nabi Musa menghadapi Fir'aun, dan pertolongan malaikat di Perang Badar." },
    { juz: 10, namaArab: "وَاعْلَمُوا", namaLatin: "Wa'lamu", rentangSurat: "Al-Anfal 41 s/d At-Taubah 92", totalSurat: 2, deskripsi: "Ketentuan ghanimah, keteguhan hati di medan jihad, pembatalan perjanjian kaum musyrik, dan 8 asnaf zakat." },
    { juz: 11, namaArab: "يَعْتَذِرُونَ", namaLatin: "Ya'taziruna", rentangSurat: "At-Taubah 93 s/d Hud 5", totalSurat: 3, deskripsi: "Taubat tiga sahabat dalam perang Tabuk, kisah kaum Nabi Yunus AS, dan jaminan rezeki setiap makhluk bernyawa." },
    { juz: 12, namaArab: "وَمَا مِنْ دَابَّةٍ", namaLatin: "Wa Ma Min Dabbah", rentangSurat: "Hud 6 s/d Yusuf 52", totalSurat: 2, deskripsi: "Kisah banjir bah bahtera Nabi Nuh AS, azab kaum Tsamud & Sodom, serta awal kisah kesabaran Nabi Yusuf AS." },
    { juz: 13, namaArab: "وَمَا أُبَرِّئُ", namaLatin: "Wa Ma Ubarri'u", rentangSurat: "Yusuf 53 s/d Ibrahim 52", totalSurat: 3, deskripsi: "Keberhasilan Nabi Yusuf memimpin lumbung pangan Mesir, tasbih petir dan malaikat, serta doa keselamatan kota Makkah." },
    { juz: 14, namaArab: "رُبَمَا", namaLatin: "Rubama", rentangSurat: "Al-Hijr 1 s/d An-Nahl 128", totalSurat: 2, deskripsi: "Kemurnian Al-Qur'an yang dijaga Allah, keajaiban lebah dan madu (An-Nahl), dan seruan berdakwah dengan hikmah." },
    { juz: 15, namaArab: "سُبْحَانَ الَّذِي", namaLatin: "Subhanallazi", rentangSurat: "Al-Isra' 1 s/d Al-Kahf 74", totalSurat: 2, deskripsi: "Mukjizat agung Isra' Mi'raj, adab birrul walidain, kisah keteguhan iman pemuda gua (Ashabul Kahfi)." },
    { juz: 16, namaArab: "قَالَ أَلَمْ", namaLatin: "Qala Alam", rentangSurat: "Al-Kahf 75 s/d Taha 135", totalSurat: 3, deskripsi: "Kisah Nabi Musa bersama Nabi Khidhir, Dzulqarnain, kelahiran suci Nabi Isa (Maryam), dan dakwah Nabi Musa di hadapan Fir'aun." },
    { juz: 17, namaArab: "اقْتَرَبَ", namaLatin: "Iqtaraba", rentangSurat: "Al-Anbiya' 1 s/d Al-Hajj 78", totalSurat: 2, deskripsi: "Rahmatan lil 'Alamin, mukjizat keselamatan Nabi Ibrahim di tengah api unggun, dan panggilan ibadah haji ke Baitullah." },
    { juz: 18, namaArab: "قَدْ أَفْلَحَ", namaLatin: "Qad Aflaha", rentangSurat: "Al-Mu'minun 1 s/d Al-Furqan 20", totalSurat: 3, deskripsi: "Karakter orang mukmin sejati, ayat Cahaya Ilahi (An-Nur), kesucian Sayyidah Aisyah RA, dan adab bertamu." },
    { juz: 19, namaArab: "وَقَالَ الَّذِينَ", namaLatin: "Wa Qalallazina", rentangSurat: "Al-Furqan 21 s/d An-Naml 55", totalSurat: 3, deskripsi: "Sifat mulia hamba Ar-Rahman (Ibadurrahman), dan anugerah kepemimpinan Nabi Sulaiman AS atas jin, manusia, dan hewan." },
    { juz: 20, namaArab: "أَمَّنْ خَلَقَ", namaLatin: "Amman Khalaqa", rentangSurat: "An-Naml 56 s/d Al-'Ankabut 45", totalSurat: 3, deskripsi: "Ratu Balqis beriman, masa kanak-kanak Nabi Musa di istana Mesir, kesombongan Qarun, dan perumpamaan rapuhnya sarang laba-laba." },
    { juz: 21, namaArab: "اتْلُ مَا أُوحِيَ", namaLatin: "Utlu Ma Uhiya", rentangSurat: "Al-'Ankabut 46 s/d Al-Ahzab 30", totalSurat: 5, deskripsi: "Kemenangan Romawi, keajaiban penciptaan manusia, nasihat Luqman Al-Hakim kepada putranya, serta keteladanan Ummahatul Mu'minin." },
    { juz: 22, namaArab: "وَمَنْ يَقْنُتْ", namaLatin: "Wa Man Yaqnut", rentangSurat: "Al-Ahzab 31 s/d Ya-Sin 27", totalSurat: 4, deskripsi: "Ketegangan Perang Khandaq, keagungan Nabi Muhammad SAW sebagai pelita penerang, dan awal mula surat Ya-Sin." },
    { juz: 23, namaArab: "وَمَا لِيَ", namaLatin: "Wa Maliya", rentangSurat: "Ya-Sin 28 s/d Az-Zumar 31", totalSurat: 4, deskripsi: "Bukti kebangkitan di hari kiamat, keikhlasan Nabi Ismail AS hendak disembelih, dan ketulusan beribadah semata karena Allah." },
    { juz: 24, namaArab: "فَمَنْ أَظْلَمُ", namaLatin: "Fa Man Azlamu", rentangSurat: "Az-Zumar 32 s/d Fussilat 46", totalSurat: 3, deskripsi: "Pintu rahmat & ampunan Allah yang terbuka luas, doa malaikat pemikul 'Arsy bagi orang beriman, dan kesaksian seluruh panca indera." },
    { juz: 25, namaArab: "إِلَيْهِ يُرَدُّ", namaLatin: "Ilayhi Yuraddu", rentangSurat: "Fussilat 47 s/d Al-Jasiyah 37", totalSurat: 5, deskripsi: "Musyawarah urusan umat, malam penuh berkah Lailatul Mubarakah (Ad-Dukhan), serta kekuasaan mutlak Allah di langit dan bumi." },
    { juz: 26, namaArab: "حم", namaLatin: "Ha Mim", rentangSurat: "Al-Ahqaf 1 s/d Az-Zariyat 30", totalSurat: 6, deskripsi: "Kemenangan nyata Perjanjian Hudaibiyah (Al-Fath), ukhuwah islamiyah (Al-Hujurat), dan dekatnya Allah dari urat leher manusia (Qaf)." },
    { juz: 27, namaArab: "قَالَ فَمَا خَطْبُكُمْ", namaLatin: "Qala Fama Khatbukum", rentangSurat: "Az-Zariyat 31 s/d Al-Hadid 29", totalSurat: 7, deskripsi: "Mukjizat terbelahnya rembulan, kenikmatan surga Ar-Rahman dan Al-Waqi'ah, serta keutamaan infak di jalan Allah (Al-Hadid)." },
    { juz: 28, namaArab: "قَدْ سَمِعَ اللَّهُ", namaLatin: "Qad Sami'allah", rentangSurat: "Al-Mujadilah 1 s/d At-Tahrim 12", totalSurat: 9, deskripsi: "Pengabulan doa pengaduan wanita, Asmaul Husna yang mulia di surat Al-Hasyr, perintah shalat Jum'at, dan doa Asiyah istri Fir'aun." },
    { juz: 29, namaArab: "تَبَارَكَ الَّذِي", namaLatin: "Tabarakallazi", rentangSurat: "Al-Mulk 1 s/d Al-Mursalat 50", totalSurat: 11, deskripsi: "Surat pelindung siksa kubur (Al-Mulk), keluhuran akhlak Nabi (Al-Qalam), qiyamullail (Al-Muzzammil), dan hakikat penciptaan manusia." },
    { juz: 30, namaArab: "عَمَّ يَتَسَاءَلُونَ", namaLatin: "'Amma Yatasa'alun", rentangSurat: "An-Naba' 1 s/d An-Nas 6", totalSurat: 37, deskripsi: "Juz 30 sarat pengingat kiamat, surat-surat pendek hafalan dasar, ketauhidan murni (Al-Ikhlas), dan perlindungan dari kejahatan (Al-Falaq & An-Nas)." }
];

export const createDefaultJuzProgress = (totalJuz: number): Record<number, JuzProgressRecord> => {
    const progress: Record<number, JuzProgressRecord> = {};
    for (let j = 1; j <= 30; j++) {
        if (j <= totalJuz) {
            progress[j] = {
                juz: j,
                status: 'Mutqin',
                tanggalUjian: '2026-08-20',
                nilaiTasmi: j % 3 === 0 ? 'A (Mumtaz)' : 'B (Jayyid Jiddan)',
                penguji: 'Ustadz Abdullah',
                catatan: 'Lancar dan mutqin sekali duduk'
            };
        } else if (j === totalJuz + 1) {
            progress[j] = {
                juz: j,
                status: 'Sedang Berjalan',
                catatan: 'Sedang menuntaskan ziyadah halaman akhir'
            };
        } else {
            progress[j] = {
                juz: j,
                status: 'Belum'
            };
        }
    }
    return progress;
};

export const QURAN_SURAHS: QuranSurah[] = [
    { nomor: 1, nama: "Al-Fatihah", ayat: 7, juz: 1 },
    { nomor: 2, nama: "Al-Baqarah", ayat: 286, juz: 1 },
    { nomor: 3, nama: "Ali 'Imran", ayat: 200, juz: 3 },
    { nomor: 4, nama: "An-Nisa'", ayat: 176, juz: 4 },
    { nomor: 5, nama: "Al-Ma'idah", ayat: 120, juz: 6 },
    { nomor: 6, nama: "Al-An'am", ayat: 165, juz: 7 },
    { nomor: 7, nama: "Al-A'raf", ayat: 206, juz: 8 },
    { nomor: 8, nama: "Al-Anfal", ayat: 75, juz: 9 },
    { nomor: 9, nama: "At-Taubah", ayat: 129, juz: 10 },
    { nomor: 10, nama: "Yunus", ayat: 109, juz: 11 },
    { nomor: 11, nama: "Hud", ayat: 123, juz: 11 },
    { nomor: 12, nama: "Yusuf", ayat: 111, juz: 12 },
    { nomor: 13, nama: "Ar-Ra'd", ayat: 43, juz: 13 },
    { nomor: 14, nama: "Ibrahim", ayat: 52, juz: 13 },
    { nomor: 15, nama: "Al-Hijr", ayat: 99, juz: 14 },
    { nomor: 16, nama: "An-Nahl", ayat: 128, juz: 14 },
    { nomor: 17, nama: "Al-Isra'", ayat: 111, juz: 15 },
    { nomor: 18, nama: "Al-Kahf", ayat: 110, juz: 15 },
    { nomor: 19, nama: "Maryam", ayat: 98, juz: 16 },
    { nomor: 20, nama: "Taha", ayat: 135, juz: 16 },
    { nomor: 21, nama: "Al-Anbiya'", ayat: 112, juz: 17 },
    { nomor: 22, nama: "Al-Hajj", ayat: 78, juz: 17 },
    { nomor: 23, nama: "Al-Mu'minun", ayat: 118, juz: 18 },
    { nomor: 24, nama: "An-Nur", ayat: 64, juz: 18 },
    { nomor: 25, nama: "Al-Furqan", ayat: 77, juz: 18 },
    { nomor: 26, nama: "Asy-Syu'ara'", ayat: 227, juz: 19 },
    { nomor: 27, nama: "An-Naml", ayat: 93, juz: 19 },
    { nomor: 28, nama: "Al-Qasas", ayat: 88, juz: 20 },
    { nomor: 29, nama: "Al-'Ankabut", ayat: 69, juz: 20 },
    { nomor: 30, nama: "Ar-Rum", ayat: 60, juz: 21 },
    { nomor: 31, nama: "Luqman", ayat: 34, juz: 21 },
    { nomor: 32, nama: "As-Sajdah", ayat: 30, juz: 21 },
    { nomor: 33, nama: "Al-Ahzab", ayat: 73, juz: 21 },
    { nomor: 34, nama: "Saba'", ayat: 54, juz: 22 },
    { nomor: 35, nama: "Fatir", ayat: 45, juz: 22 },
    { nomor: 36, nama: "Ya-Sin", ayat: 83, juz: 22 },
    { nomor: 37, nama: "As-Saffat", ayat: 182, juz: 23 },
    { nomor: 38, nama: "Sad", ayat: 88, juz: 23 },
    { nomor: 39, nama: "Az-Zumar", ayat: 75, juz: 23 },
    { nomor: 40, nama: "Ghafir", ayat: 85, juz: 24 },
    { nomor: 41, nama: "Fussilat", ayat: 54, juz: 24 },
    { nomor: 42, nama: "Asy-Syura", ayat: 53, juz: 25 },
    { nomor: 43, nama: "Az-Zukhruf", ayat: 89, juz: 25 },
    { nomor: 44, nama: "Ad-Dukhan", ayat: 59, juz: 25 },
    { nomor: 45, nama: "Al-Jasiyah", ayat: 37, juz: 25 },
    { nomor: 46, nama: "Al-Ahqaf", ayat: 35, juz: 26 },
    { nomor: 47, nama: "Muhammad", ayat: 38, juz: 26 },
    { nomor: 48, nama: "Al-Fath", ayat: 29, juz: 26 },
    { nomor: 49, nama: "Al-Hujurat", ayat: 18, juz: 26 },
    { nomor: 50, nama: "Qaf", ayat: 45, juz: 26 },
    { nomor: 51, nama: "Az-Zariyat", ayat: 60, juz: 26 },
    { nomor: 52, nama: "At-Tur", ayat: 49, juz: 27 },
    { nomor: 53, nama: "An-Najm", ayat: 62, juz: 27 },
    { nomor: 54, nama: "Al-Qamar", ayat: 55, juz: 27 },
    { nomor: 55, nama: "Ar-Rahman", ayat: 78, juz: 27 },
    { nomor: 56, nama: "Al-Waqi'ah", ayat: 96, juz: 27 },
    { nomor: 57, nama: "Al-Hadid", ayat: 29, juz: 27 },
    { nomor: 58, nama: "Al-Mujadilah", ayat: 22, juz: 28 },
    { nomor: 59, nama: "Al-Hasyr", ayat: 24, juz: 28 },
    { nomor: 60, nama: "Al-Mumtahanah", ayat: 13, juz: 28 },
    { nomor: 61, nama: "As-Saff", ayat: 14, juz: 28 },
    { nomor: 62, nama: "Al-Jumu'ah", ayat: 11, juz: 28 },
    { nomor: 63, nama: "Al-Munafiqun", ayat: 11, juz: 28 },
    { nomor: 64, nama: "At-Taghabun", ayat: 18, juz: 28 },
    { nomor: 65, nama: "At-Talaq", ayat: 12, juz: 28 },
    { nomor: 66, nama: "At-Tahrim", ayat: 12, juz: 28 },
    { nomor: 67, nama: "Al-Mulk", ayat: 30, juz: 29 },
    { nomor: 68, nama: "Al-Qalam", ayat: 52, juz: 29 },
    { nomor: 69, nama: "Al-Haqqah", ayat: 52, juz: 29 },
    { nomor: 70, nama: "Al-Ma'arij", ayat: 44, juz: 29 },
    { nomor: 71, nama: "Nuh", ayat: 28, juz: 29 },
    { nomor: 72, nama: "Al-Jinn", ayat: 28, juz: 29 },
    { nomor: 73, nama: "Al-Muzzammil", ayat: 20, juz: 29 },
    { nomor: 74, nama: "Al-Muddassir", ayat: 56, juz: 29 },
    { nomor: 75, nama: "Al-Qiyamah", ayat: 40, juz: 29 },
    { nomor: 76, nama: "Al-Insan", ayat: 31, juz: 29 },
    { nomor: 77, nama: "Al-Mursalat", ayat: 50, juz: 29 },
    { nomor: 78, nama: "An-Naba'", ayat: 40, juz: 30 },
    { nomor: 79, nama: "An-Nazi'at", ayat: 46, juz: 30 },
    { nomor: 80, nama: "'Abasa", ayat: 42, juz: 30 },
    { nomor: 81, nama: "At-Takwir", ayat: 29, juz: 30 },
    { nomor: 82, nama: "Al-Infitar", ayat: 19, juz: 30 },
    { nomor: 83, nama: "Al-Mutaffifin", ayat: 36, juz: 30 },
    { nomor: 84, nama: "Al-Insyiqaq", ayat: 25, juz: 30 },
    { nomor: 85, nama: "Al-Buruj", ayat: 22, juz: 30 },
    { nomor: 86, nama: "At-Tariq", ayat: 17, juz: 30 },
    { nomor: 87, nama: "Al-A'la", ayat: 19, juz: 30 },
    { nomor: 88, nama: "Al-Ghasyiyah", ayat: 26, juz: 30 },
    { nomor: 89, nama: "Al-Fajr", ayat: 30, juz: 30 },
    { nomor: 90, nama: "Al-Balad", ayat: 20, juz: 30 },
    { nomor: 91, nama: "Asy-Syams", ayat: 15, juz: 30 },
    { nomor: 92, nama: "Al-Lail", ayat: 21, juz: 30 },
    { nomor: 93, nama: "Ad-Duha", ayat: 11, juz: 30 },
    { nomor: 94, nama: "Asy-Syarh", ayat: 8, juz: 30 },
    { nomor: 95, nama: "At-Tin", ayat: 8, juz: 30 },
    { nomor: 96, nama: "Al-'Alaq", ayat: 19, juz: 30 },
    { nomor: 97, nama: "Al-Qadr", ayat: 5, juz: 30 },
    { nomor: 98, nama: "Al-Bayyinah", ayat: 8, juz: 30 },
    { nomor: 99, nama: "Az-Zalzalah", ayat: 8, juz: 30 },
    { nomor: 100, nama: "Al-'Adiyat", ayat: 11, juz: 30 },
    { nomor: 101, nama: "Al-Qari'ah", ayat: 11, juz: 30 },
    { nomor: 102, nama: "At-Takasur", ayat: 8, juz: 30 },
    { nomor: 103, nama: "Al-'Asr", ayat: 3, juz: 30 },
    { nomor: 104, nama: "Al-Humazah", ayat: 9, juz: 30 },
    { nomor: 105, nama: "Al-Fil", ayat: 5, juz: 30 },
    { nomor: 106, nama: "Quraisy", ayat: 4, juz: 30 },
    { nomor: 107, nama: "Al-Ma'un", ayat: 7, juz: 30 },
    { nomor: 108, nama: "Al-Kausar", ayat: 3, juz: 30 },
    { nomor: 109, nama: "Al-Kafirun", ayat: 6, juz: 30 },
    { nomor: 110, nama: "An-Nasr", ayat: 3, juz: 30 },
    { nomor: 111, nama: "Al-Lahab", ayat: 5, juz: 30 },
    { nomor: 112, nama: "Al-Ikhlas", ayat: 4, juz: 30 },
    { nomor: 113, nama: "Al-Falaq", ayat: 5, juz: 30 },
    { nomor: 114, nama: "An-Nas", ayat: 6, juz: 30 }
];

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
        status: 'Aktif',
        juzProgress: createDefaultJuzProgress(7)
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
        status: 'Aktif',
        juzProgress: createDefaultJuzProgress(12)
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
        status: 'Aktif',
        juzProgress: createDefaultJuzProgress(28)
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
        status: 'Aktif',
        juzProgress: createDefaultJuzProgress(3)
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
        status: 'Aktif',
        juzProgress: createDefaultJuzProgress(15)
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
        status: 'Aktif',
        juzProgress: createDefaultJuzProgress(9)
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
        catatan: "Makharijul huruf sangat fasih, pertahankan mad thabi'i"
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
        catatan: "Siap untuk tasmi' 5 juz pekan depan"
    },
    {
        id: 'set-5',
        santriId: 's-4',
        santriNama: 'Rizki Maulana Malik',
        tanggal: '2026-10-16',
        jenis: 'Ziyadah',
        surat: "An-Nazi'at",
        ayatAwal: 1,
        ayatAkhir: 46,
        juz: 30,
        nilai: 'B (Jayyid Jiddan)',
        musyrif: 'Ustadz Abdullah',
        catatan: 'Tingkatkan pengucapan makhraj huruf kha dan shod'
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
