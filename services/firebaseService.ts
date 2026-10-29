import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getFirestore, 
    doc, 
    getDocFromServer, 
    collection, 
    onSnapshot, 
    setDoc, 
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Santri, SetoranRecord, JurnalBelajarSantri, RencanaSetoran } from '../types';
import { INITIAL_SANTRI, INITIAL_SETORAN, INITIAL_JURNAL_BELAJAR, INITIAL_RENCANA_SETORAN } from '../mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Connection test on boot
export async function testConnection(): Promise<boolean> {
    try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firebase Firestore connected successfully.");
        return true;
    } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration: client is offline.");
        } else {
            console.warn("Firestore connection check note:", error);
        }
        return false;
    }
}
testConnection();

// Auto-seed initial data to Firestore if collection is empty
export async function seedInitialFirestoreData() {
    try {
        const santriSnap = await getDocs(collection(db, 'santri'));
        if (santriSnap.empty) {
            console.log("Seeding initial Santri to Firestore...");
            for (const s of INITIAL_SANTRI) {
                await setDoc(doc(db, 'santri', s.id), s);
            }
        }

        const setoranSnap = await getDocs(collection(db, 'setoran'));
        if (setoranSnap.empty) {
            console.log("Seeding initial Setoran to Firestore...");
            for (const setoran of INITIAL_SETORAN) {
                await setDoc(doc(db, 'setoran', setoran.id), setoran);
            }
        }

        const jurnalSnap = await getDocs(collection(db, 'jurnal'));
        if (jurnalSnap.empty) {
            console.log("Seeding initial Jurnal to Firestore...");
            for (const j of INITIAL_JURNAL_BELAJAR) {
                await setDoc(doc(db, 'jurnal', j.id), j);
            }
        }

        const rencanaSnap = await getDocs(collection(db, 'rencana'));
        if (rencanaSnap.empty) {
            console.log("Seeding initial Rencana to Firestore...");
            for (const r of INITIAL_RENCANA_SETORAN) {
                await setDoc(doc(db, 'rencana', r.id), r);
            }
        }
    } catch (err) {
        console.warn("Firestore auto-seed notice:", err);
    }
}

// Real-time Firestore Listeners with local synchronization
export function subscribeSantri(callback: (list: Santri[]) => void) {
    try {
        return onSnapshot(collection(db, 'santri'), (snap) => {
            if (!snap.empty) {
                const list = snap.docs.map(d => d.data() as Santri);
                callback(list);
            }
        }, (err) => {
            console.warn("Firestore Santri subscribe notice:", err);
        });
    } catch {
        return () => {};
    }
}

export function subscribeSetoran(callback: (list: SetoranRecord[]) => void) {
    try {
        return onSnapshot(collection(db, 'setoran'), (snap) => {
            if (!snap.empty) {
                const list = snap.docs.map(d => d.data() as SetoranRecord);
                // Sort by date descending
                list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
                callback(list);
            }
        }, (err) => {
            console.warn("Firestore Setoran subscribe notice:", err);
        });
    } catch {
        return () => {};
    }
}

export function subscribeJurnal(callback: (list: JurnalBelajarSantri[]) => void) {
    try {
        return onSnapshot(collection(db, 'jurnal'), (snap) => {
            if (!snap.empty) {
                const list = snap.docs.map(d => d.data() as JurnalBelajarSantri);
                list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
                callback(list);
            }
        }, (err) => {
            console.warn("Firestore Jurnal subscribe notice:", err);
        });
    } catch {
        return () => {};
    }
}

export function subscribeRencana(callback: (list: RencanaSetoran[]) => void) {
    try {
        return onSnapshot(collection(db, 'rencana'), (snap) => {
            if (!snap.empty) {
                const list = snap.docs.map(d => d.data() as RencanaSetoran);
                list.sort((a, b) => b.tanggalTarget.localeCompare(a.tanggalTarget));
                callback(list);
            }
        }, (err) => {
            console.warn("Firestore Rencana subscribe notice:", err);
        });
    } catch {
        return () => {};
    }
}

// Write Helpers
export async function syncSantriDoc(santri: Santri) {
    try {
        await setDoc(doc(db, 'santri', santri.id), santri);
    } catch (e) {
        console.warn("Firestore save santri error:", e);
    }
}

export async function syncSetoranDoc(setoran: SetoranRecord) {
    try {
        await setDoc(doc(db, 'setoran', setoran.id), setoran);
    } catch (e) {
        console.warn("Firestore save setoran error:", e);
    }
}

export async function syncJurnalDoc(jurnal: JurnalBelajarSantri) {
    try {
        await setDoc(doc(db, 'jurnal', jurnal.id), jurnal);
    } catch (e) {
        console.warn("Firestore save jurnal error:", e);
    }
}

export async function syncRencanaDoc(rencana: RencanaSetoran) {
    try {
        await setDoc(doc(db, 'rencana', rencana.id), rencana);
    } catch (e) {
        console.warn("Firestore save rencana error:", e);
    }
}

// Delete Helpers
export async function deleteSantriDoc(id: string) {
    try {
        await deleteDoc(doc(db, 'santri', id));
    } catch (e) {
        console.warn("Firestore delete santri error:", e);
    }
}

export async function deleteSetoranDoc(id: string) {
    try {
        await deleteDoc(doc(db, 'setoran', id));
    } catch (e) {
        console.warn("Firestore delete setoran error:", e);
    }
}

export async function deleteJurnalDoc(id: string) {
    try {
        await deleteDoc(doc(db, 'jurnal', id));
    } catch (e) {
        console.warn("Firestore delete jurnal error:", e);
    }
}

export async function deleteRencanaDoc(id: string) {
    try {
        await deleteDoc(doc(db, 'rencana', id));
    } catch (e) {
        console.warn("Firestore delete rencana error:", e);
    }
}
