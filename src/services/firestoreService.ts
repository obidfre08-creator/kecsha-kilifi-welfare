import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Member,
  Contrib,
  Payout,
  WelfareCase,
  Meeting,
  Announcement,
  AppNotification,
  AuditEntry,
  WelfareSettings,
  Officer,
  Credential,
  BrandConfig,
  UserRole
} from '../types';

export async function sha256(t: string): Promise<string> {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'h-' + t;
  }
}

export function compressImage(src: string, maxW = 750, q = 0.65): Promise<string> {
  return new Promise((resolve) => {
    const i = new Image();
    i.onload = () => {
      const s = Math.min(1, maxW / i.width);
      const c = document.createElement('canvas');
      c.width = Math.round(i.width * s);
      c.height = Math.round(i.height * s);
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(i, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', q));
      } else {
        resolve(src);
      }
    };
    i.onerror = () => resolve(src);
    i.src = src;
  });
}

// Subscriptions
export function subscribeMembers(callback: (members: Member[]) => void) {
  const colRef = collection(db, 'members');
  return onSnapshot(colRef, (snapshot) => {
    const list: Member[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Member);
    });
    // Sort by id
    list.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    callback(list);
  }, (err) => {
    console.error('Firestore members subscribe error:', err);
  });
}

export function subscribeContribs(callback: (contribs: Contrib[]) => void) {
  const colRef = collection(db, 'contribs');
  return onSnapshot(colRef, (snapshot) => {
    const list: Contrib[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Contrib);
    });
    // Latest first
    list.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    callback(list);
  }, (err) => {
    console.error('Firestore contribs subscribe error:', err);
  });
}

export function subscribePayouts(callback: (payouts: Payout[]) => void) {
  const colRef = collection(db, 'payouts');
  return onSnapshot(colRef, (snapshot) => {
    const list: Payout[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Payout);
    });
    list.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    callback(list);
  }, (err) => {
    console.error('Firestore payouts subscribe error:', err);
  });
}

export function subscribeCases(callback: (cases: WelfareCase[]) => void) {
  const colRef = collection(db, 'cases');
  return onSnapshot(colRef, (snapshot) => {
    const list: WelfareCase[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as WelfareCase);
    });
    list.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    callback(list);
  }, (err) => {
    console.error('Firestore cases subscribe error:', err);
  });
}

export function subscribeMeetings(callback: (meetings: Meeting[]) => void) {
  const colRef = collection(db, 'meetings');
  return onSnapshot(colRef, (snapshot) => {
    const list: Meeting[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Meeting);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore meetings subscribe error:', err);
  });
}

export function subscribeAnnouncements(callback: (anns: Announcement[]) => void) {
  const colRef = collection(db, 'announcements');
  return onSnapshot(colRef, (snapshot) => {
    const list: Announcement[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({ id: d.id, ...data } as Announcement);
    });
    list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    callback(list);
  }, (err) => {
    console.error('Firestore announcements subscribe error:', err);
  });
}

export function subscribeNotifications(callback: (notifs: AppNotification[]) => void) {
  const colRef = collection(db, 'notifications');
  return onSnapshot(colRef, (snapshot) => {
    const list: AppNotification[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({ id: d.id, ...data } as AppNotification);
    });
    list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    callback(list);
  }, (err) => {
    console.error('Firestore notifications subscribe error:', err);
  });
}

export function subscribeAuditLog(callback: (audits: AuditEntry[]) => void) {
  const colRef = collection(db, 'audit_log');
  return onSnapshot(colRef, (snapshot) => {
    const list: AuditEntry[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({ id: d.id, ...data } as AuditEntry);
    });
    list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    callback(list);
  }, (err) => {
    console.error('Firestore audit subscribe error:', err);
  });
}

export function subscribeSystemConfig(
  callback: (data: {
    settings: WelfareSettings | null;
    officers: Record<string, Officer> | null;
    creds: Record<string, Credential> | null;
    brand: BrandConfig | null;
  }) => void
) {
  const colRef = collection(db, 'system_config');
  return onSnapshot(colRef, (snapshot) => {
    let settings: WelfareSettings | null = null;
    let officers: Record<string, Officer> | null = null;
    let creds: Record<string, Credential> | null = null;
    let brand: BrandConfig | null = null;

    snapshot.forEach((d) => {
      if (d.id === 'settings') settings = d.data() as WelfareSettings;
      if (d.id === 'officers') officers = d.data() as Record<string, Officer>;
      if (d.id === 'creds') creds = d.data() as Record<string, Credential>;
      if (d.id === 'brand') brand = d.data() as BrandConfig;
    });

    callback({ settings, officers, creds, brand });
  }, (err) => {
    console.error('Firestore system_config subscribe error:', err);
  });
}

// Data writers
export async function saveMember(member: Member) {
  const docRef = doc(db, 'members', member.id);
  await setDoc(docRef, member, { merge: true });
}

export async function deleteMemberFirestore(memberId: string) {
  const docRef = doc(db, 'members', memberId);
  await deleteDoc(docRef);
}

export async function saveContrib(contrib: Contrib) {
  const docRef = doc(db, 'contribs', contrib.id);
  await setDoc(docRef, contrib, { merge: true });
}

export async function savePayout(payout: Payout) {
  const docRef = doc(db, 'payouts', payout.id);
  await setDoc(docRef, payout, { merge: true });
}

export async function saveCase(welfareCase: WelfareCase) {
  const docRef = doc(db, 'cases', welfareCase.id);
  await setDoc(docRef, welfareCase, { merge: true });
}

export async function saveMeeting(meeting: Meeting) {
  const docRef = doc(db, 'meetings', meeting.id);
  await setDoc(docRef, meeting, { merge: true });
}

export async function addAnnouncement(ann: Announcement) {
  const colRef = collection(db, 'announcements');
  await addDoc(colRef, {
    ...ann,
    ts: Date.now(),
  });
}

export async function addNotification(notif: AppNotification) {
  const colRef = collection(db, 'notifications');
  await addDoc(colRef, {
    ...notif,
    ts: Date.now(),
  });
}

export async function markNotificationsRead(role: UserRole, notifs: AppNotification[]) {
  const matching = notifs.filter((n) => n.role === role && n.u && n.id);
  for (const n of matching) {
    if (n.id) {
      await updateDoc(doc(db, 'notifications', n.id), { u: false });
    }
  }
}

export async function addAuditLog(who: string, act: string, det: string) {
  const colRef = collection(db, 'audit_log');
  const now = new Date();
  await addDoc(colRef, {
    t: now.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }),
    ts: Date.now(),
    who,
    act,
    det,
  });
}

export async function updateSettings(settings: WelfareSettings) {
  await setDoc(doc(db, 'system_config', 'settings'), settings);
}

export async function updateOfficers(officers: Record<string, Officer>) {
  await setDoc(doc(db, 'system_config', 'officers'), officers);
}

export async function updateCreds(creds: Record<string, Credential>) {
  await setDoc(doc(db, 'system_config', 'creds'), creds);
}

export async function updateBrand(brand: BrandConfig) {
  await setDoc(doc(db, 'system_config', 'brand'), brand);
}

// Initialization of default config if fresh
export async function initializeDefaultDataIfNeeded() {
  try {
    const credsDoc = await getDoc(doc(db, 'system_config', 'creds'));
    if (!credsDoc.exists()) {
      const defaultHash = await sha256('admin123');
      await setDoc(doc(db, 'system_config', 'creds'), {
        admin: { u: 'admin@kecsha.co.ke', p: defaultHash },
        chair: { u: '—', p: '—' },
        secretary: { u: '—', p: '—' },
        treasurer: { u: '—', p: '—' },
      });
    }

    const settingsDoc = await getDoc(doc(db, 'system_config', 'settings'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'system_config', 'settings'), {
        min: 1000,
        death: 150000,
        emer: 30000,
        sms: true,
        dual: true,
      });
    }

    const officersDoc = await getDoc(doc(db, 'system_config', 'officers'));
    if (!officersDoc.exists()) {
      await setDoc(doc(db, 'system_config', 'officers'), {
        admin: { name: 'System Administrator', status: 'Active' },
        chair: { name: 'Vacant', status: 'Vacant' },
        secretary: { name: 'Vacant', status: 'Vacant' },
        treasurer: { name: 'Vacant', status: 'Vacant' },
      });
    }

    const brandDoc = await getDoc(doc(db, 'system_config', 'brand'));
    if (!brandDoc.exists()) {
      await setDoc(doc(db, 'system_config', 'brand'), {
        logo: null,
      });
    }

    // Seed initial meeting if meetings are empty
    const meetingsSnap = await getDocs(collection(db, 'meetings'));
    if (meetingsSnap.empty) {
      const initialMeeting: Meeting = {
        id: 'MTG-2026-01',
        title: 'Q1 Kilifi Head Teachers Welfare Executive Meeting',
        date: '15 Oct 2026',
        venue: 'Kilifi Township Primary School Hall',
        att: 'Executive Committee & Sub-County Coordinators',
        agendaStatus: 'Approved',
        agenda: [
          'Opening prayer & adoption of meeting agenda',
          'Review of membership registrations and beneficiary compliance',
          'Treasurer\'s financial report and monthly contributions verification status',
          'Emergency assistance requests and pending death benefit documentation',
          'Date and preparations for the Annual General Meeting (AGM)',
        ],
        minutes: 'Meeting scheduled. Minutes draft will be recorded and ratified by the Chairperson.',
      };
      await setDoc(doc(db, 'meetings', initialMeeting.id), initialMeeting);
    }

    // Seed initial announcement if empty
    const annSnap = await getDocs(collection(db, 'announcements'));
    if (annSnap.empty) {
      await addAnnouncement({
        date: new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
        txt: 'Welcome to the Kilifi County KECSHA Welfare Association portal. All data is synchronized in real-time across all devices via Firebase Firestore. Register as a member, upload your 35×45mm photograph, and verify your contributions.',
        ts: Date.now(),
      });
    }

    // Seed initial audit entry if empty
    const auditSnap = await getDocs(collection(db, 'audit_log'));
    if (auditSnap.empty) {
      await addAuditLog(
        'System',
        'Database connected',
        'Real-time Firebase Firestore database synchronized across all devices'
      );
    }
  } catch (err) {
    console.error('Error during Firestore initialization:', err);
  }
}
