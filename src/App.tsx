import React, { useState, useEffect } from 'react';
import {
  UserRole,
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
} from './types';
import {
  subscribeMembers,
  subscribeContribs,
  subscribePayouts,
  subscribeCases,
  subscribeMeetings,
  subscribeAnnouncements,
  subscribeNotifications,
  subscribeAuditLog,
  subscribeSystemConfig,
  saveMember,
  saveContrib,
  savePayout,
  saveCase,
  saveMeeting,
  addAnnouncement,
  addNotification,
  markNotificationsRead,
  addAuditLog,
  updateSettings,
  updateOfficers,
  updateCreds,
  updateBrand,
  initializeDefaultDataIfNeeded,
  deleteMemberFirestore,
} from './services/firestoreService';
import { LandingView } from './components/LandingView';
import { RegisterView } from './components/RegisterView';
import { AdminPortal } from './components/AdminPortal';
import { ChairPortal } from './components/ChairPortal';
import { SecretaryPortal } from './components/SecretaryPortal';
import { TreasurerPortal } from './components/TreasurerPortal';
import { MemberPortal } from './components/MemberPortal';
import { CropModal } from './components/CropModal';
import { ToastContainer, ToastItem } from './components/ToastContainer';
import { Crest } from './components/Crest';
import { initials } from './utils/helpers';
import {
  Grid,
  Users,
  Shield,
  Stamp,
  FileText,
  Coins,
  Calendar,
  BookOpen,
  Settings as CogIcon,
  Bell,
  AlertTriangle,
  BarChart2,
  Megaphone,
  Book,
  Camera,
  Lock,
  LogOut,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // App views: 'landing' | 'register' | 'app'
  const [currentView, setCurrentView] = useState<'landing' | 'register' | 'app'>('landing');

  // Authenticated state
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [activePage, setActivePage] = useState<string>('dash');
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  // Firestore Data Collections
  const [members, setMembers] = useState<Member[]>([]);
  const [contribs, setContribs] = useState<Contrib[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [cases, setCases] = useState<WelfareCase[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Config Collections
  const [settings, setSettings] = useState<WelfareSettings>({
    min: 1000,
    death: 150000,
    emer: 30000,
    sms: true,
    dual: true,
  });
  const [officers, setOfficers] = useState<Record<string, Officer>>({
    admin: { name: 'System Administrator', status: 'Active' },
    chair: { name: 'Vacant', status: 'Vacant' },
    secretary: { name: 'Vacant', status: 'Vacant' },
    treasurer: { name: 'Vacant', status: 'Vacant' },
  });
  const [creds, setCreds] = useState<Record<string, Credential>>({
    admin: { u: 'admin@kecsha.co.ke', p: 'admin123' },
    chair: { u: '—', p: '—' },
    secretary: { u: '—', p: '—' },
    treasurer: { u: '—', p: '—' },
  });
  const [brand, setBrand] = useState<BrandConfig>({ logo: null });

  // Clock
  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');

  // Notifications popup
  const [showBellPanel, setShowBellPanel] = useState(false);

  // Crop Modal
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    aspect: number;
    cb: (dataUrl: string) => void;
  }>({
    isOpen: false,
    imageSrc: null,
    aspect: 45 / 35,
    cb: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (msg: string, kind?: 'info' | 'err') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, msg, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  // Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('en-KE'));
      setClockDate(
        now.toLocaleDateString('en-KE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) + ' · EAT'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and Subscribe to Firestore in real-time
  useEffect(() => {
    // Check initial seed
    initializeDefaultDataIfNeeded();

    // Real-time subscribers
    const unsubMembers = subscribeMembers((data) => setMembers(data));
    const unsubContribs = subscribeContribs((data) => setContribs(data));
    const unsubPayouts = subscribePayouts((data) => setPayouts(data));
    const unsubCases = subscribeCases((data) => setCases(data));
    const unsubMeetings = subscribeMeetings((data) => setMeetings(data));
    const unsubAnns = subscribeAnnouncements((data) => setAnnouncements(data));
    const unsubNotifs = subscribeNotifications((data) => setNotifications(data));
    const unsubAudits = subscribeAuditLog((data) => setAuditLog(data));
    const unsubConfig = subscribeSystemConfig((cfg) => {
      if (cfg.settings) setSettings(cfg.settings);
      if (cfg.officers) setOfficers(cfg.officers);
      if (cfg.creds) setCreds(cfg.creds);
      if (cfg.brand) setBrand(cfg.brand);
    });

    return () => {
      unsubMembers();
      unsubContribs();
      unsubPayouts();
      unsubCases();
      unsubMeetings();
      unsubAnns();
      unsubNotifs();
      unsubAudits();
      unsubConfig();
    };
  }, []);

  // Open cropper helper
  const handleOpenCrop = (src: string, aspect: number, cb: (dataUrl: string) => void) => {
    setCropModal({
      isOpen: true,
      imageSrc: src,
      aspect,
      cb,
    });
  };

  // Handle Login
  const handleLogin = (role: UserRole, memberId?: string) => {
    setActiveRole(role);
    setActiveMemberId(memberId || null);
    setActivePage('dash');
    setCurrentView('app');

    const roleName = {
      admin: 'System Administrator',
      chair: 'Chairperson',
      secretary: 'Secretary',
      treasurer: 'Treasurer',
      member: 'Member',
    }[role];

    addAuditLog(roleName, 'Sign-in', `Signed in to ${roleName} portal on device`);
    addToast(`Signed in as <b>${roleName}</b> — Welcome`);
  };

  const handleSignOut = () => {
    if (activeRole) {
      const roleName = {
        admin: 'System Administrator',
        chair: 'Chairperson',
        secretary: 'Secretary',
        treasurer: 'Treasurer',
        member: 'Member',
      }[activeRole];
      addAuditLog(roleName, 'Sign-out', 'User signed out');
    }
    setActiveRole(null);
    setActiveMemberId(null);
    setCurrentView('landing');
    setShowBellPanel(false);
  };

  // Member Registration Submit
  const handleRegisterSubmit = async (newMember: Member) => {
    await saveMember(newMember);
    await addAuditLog(
      'Registration Portal',
      'Member registered',
      `${newMember.name} · ${newMember.school} · ${newMember.id} · Applied as ${newMember.position}`
    );
    await addNotification({
      role: newMember.position === 'Chairperson' ? 'admin' : 'chair',
      u: true,
      txt: `New ${newMember.position} registration awaiting approval: ${newMember.name} (${newMember.id})`,
    });
  };

  // Admin approves Chairperson
  const handleApproveChair = async (m: Member) => {
    const updatedMember: Member = {
      ...m,
      status: 'Active',
      role: 'Chairperson',
      position: 'Chairperson',
      joined: new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    await saveMember(updatedMember);

    const updatedOfficers = {
      ...officers,
      chair: { name: m.name, status: 'Active' as const },
    };
    await updateOfficers(updatedOfficers);

    const updatedCreds = {
      ...creds,
      chair: { u: m.user, p: m.pass },
    };
    await updateCreds(updatedCreds);

    await addAuditLog(
      'System Administrator',
      'Chairperson approved & activated',
      `${m.name} · ${m.id} · username ${m.user}`
    );
    addToast(`<b>${m.name}</b> approved & activated as Chairperson`);
  };

  // Chairperson approves member / officer
  const handleApproveMember = async (m: Member) => {
    const today = new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    const posKey = m.position === 'Secretary' ? 'secretary' : m.position === 'Treasurer' ? 'treasurer' : undefined;

    const updatedMember: Member = {
      ...m,
      status: 'Active',
      joined: today,
      role: posKey ? m.position : m.role,
    };
    await saveMember(updatedMember);

    if (posKey) {
      const updatedOfficers = {
        ...officers,
        [posKey]: { name: m.name, status: 'Active' as const },
      };
      await updateOfficers(updatedOfficers);

      const updatedCreds = {
        ...creds,
        [posKey]: { u: m.user, p: m.pass },
      };
      await updateCreds(updatedCreds);
    }

    await addAuditLog(
      'Chairperson',
      'Registration approved & activated',
      `${m.name} · ${m.id} · position ${m.position}`
    );
    addToast(`<b>${m.name}</b> approved & activated in Firestore`);
  };

  // Decline member
  const handleDeclineMember = async (m: Member, reason: string) => {
    const updated: Member = { ...m, status: 'Declined' };
    await saveMember(updated);
    await addAuditLog('Office-Bearer', 'Registration declined', `${m.name} — ${reason}`);
    addToast(`Registration for ${m.name} declined`, 'err');
  };

  // Admin deletes Chairperson
  const handleDeleteChairperson = async (m: Member) => {
    await deleteMemberFirestore(m.id);
    const updatedOfficers = {
      ...officers,
      chair: { name: 'Vacant', status: 'Vacant' as const },
    };
    await updateOfficers(updatedOfficers);
    const updatedCreds = {
      ...creds,
      chair: { u: '—', p: '—' },
    };
    await updateCreds(updatedCreds);
    await addAuditLog(
      'System Administrator',
      'Chairperson deleted',
      `${m.name} (${m.id}) deleted by Administrator`
    );
    addToast(`Chairperson <b>${m.name}</b> deleted successfully`, 'err');
  };

  // Chairperson deletes member they approved / activated
  const handleDeleteMemberChair = async (m: Member) => {
    await deleteMemberFirestore(m.id);
    const posKey = m.position === 'Secretary' ? 'secretary' : m.position === 'Treasurer' ? 'treasurer' : undefined;
    if (posKey) {
      const updatedOfficers = {
        ...officers,
        [posKey]: { name: 'Vacant', status: 'Vacant' as const },
      };
      await updateOfficers(updatedOfficers);
      const updatedCreds = {
        ...creds,
        [posKey]: { u: '—', p: '—' },
      };
      await updateCreds(updatedCreds);
    }
    await addAuditLog(
      'Chairperson',
      'Member deleted',
      `${m.name} (${m.id}) deleted by Chairperson`
    );
    addToast(`Member <b>${m.name}</b> deleted successfully`, 'err');
  };

  // Case approval by Chairperson
  const handleApproveCase = async (c: WelfareCase) => {
    const updated: WelfareCase = { ...c, status: 'Approved for Payment' };
    await saveCase(updated);
    await addAuditLog('Chairperson', 'Welfare benefit approved', `${c.id} — ${c.type} for ${c.member}`);
    await addNotification({
      role: 'treasurer',
      u: true,
      txt: `${c.id} approved by Chairperson — ready for disbursement.`,
    });
    addToast(`Case <b>${c.id}</b> approved — ready for Treasurer disbursement`);
  };

  // Case rejection
  const handleRejectCase = async (c: WelfareCase, reason: string) => {
    const updated: WelfareCase = { ...c, status: 'Rejected', note: `Rejected: ${reason}` };
    await saveCase(updated);
    await addAuditLog('Chairperson', 'Case rejected', `${c.id} — ${reason}`);
    addToast(`Case ${c.id} rejected`, 'err');
  };

  // Countersign Treasurer's contribution
  const handleCountersignContrib = async (c: Contrib) => {
    const updated: Contrib = { ...c, status: 'Verified', v: true };
    await saveContrib(updated);

    const mm = members.find((x) => x.id === c.m);
    if (mm) {
      await saveMember({
        ...mm,
        total: mm.total + c.amt,
        months: mm.months + 1,
      });
    }

    await addAuditLog(
      'Chairperson',
      'Contribution countersigned & verified',
      `Treasurer's payment ${c.id} · ${c.month} · KSh ${c.amt}`
    );
    addToast(`Contribution ${c.id} countersigned and verified`);
  };

  // Treasurer verifies member contribution
  const handleVerifyContrib = async (c: Contrib) => {
    const updated: Contrib = { ...c, status: 'Verified', v: true };
    await saveContrib(updated);

    const mm = members.find((x) => x.id === c.m);
    if (mm) {
      await saveMember({
        ...mm,
        total: mm.total + c.amt,
        months: mm.months + 1,
      });
    }

    await addAuditLog(
      'Treasurer',
      'Contribution verified',
      `${c.m} · ${c.month} · KSh ${c.amt} · Ref ${c.ref}`
    );
    await addNotification({
      role: 'member',
      u: true,
      txt: `Your ${c.month} contribution of KSh ${c.amt.toLocaleString()} has been verified ✓`,
    });
    addToast(`Contribution verified and credited in real-time`);
  };

  // Treasurer rejects member contribution proof
  const handleRejectContrib = async (c: Contrib, reason: string) => {
    const updated: Contrib = { ...c, status: 'Rejected', note: `Rejected: ${reason}` };
    await saveContrib(updated);
    await addAuditLog(
      'Treasurer',
      'Contribution proof rejected',
      `${c.m} · ${c.month} — ${reason}`
    );
    await addNotification({
      role: 'member',
      u: true,
      txt: `Your ${c.month} contribution proof was rejected: ${reason}. Please resubmit with a clear receipt.`,
    });
    addToast('Payment proof rejected — member notified', 'err');
  };

  // Treasurer records direct office entry
  const handleRecordOfficeContrib = async (newC: Contrib) => {
    await saveContrib(newC);
    const mm = members.find((x) => x.id === newC.m);
    if (mm) {
      await saveMember({
        ...mm,
        total: mm.total + newC.amt,
        months: mm.months + 1,
      });
    }
    await addAuditLog(
      'Treasurer',
      'Direct contribution recorded',
      `${newC.m} · ${newC.month} · KSh ${newC.amt}`
    );
  };

  // Treasurer records welfare disbursement
  const handleDisburseCase = async (caseItem: WelfareCase, ref: string) => {
    const updatedCase: WelfareCase = {
      ...caseItem,
      status: 'Paid',
      note: `Paid on ${new Date().toLocaleDateString('en-KE')} · Ref ${ref}`,
    };
    await saveCase(updatedCase);

    const newPayout: Payout = {
      id: `PO-${String(payouts.length + 1).padStart(4, '0')}`,
      case: caseItem.id,
      to: caseItem.member,
      amt: caseItem.amt,
      date: new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
      ref,
    };
    await savePayout(newPayout);

    await addAuditLog(
      'Treasurer',
      'Disbursement executed',
      `${caseItem.id} — KSh ${caseItem.amt.toLocaleString()} to ${caseItem.member} · Ref ${ref}`
    );
  };

  // Member navigation items
  const getNavItems = (role: UserRole) => {
    const pendNonChair = members.filter(
      (m) => m.status === 'Pending Verification' && m.position !== 'Chairperson'
    ).length;
    const pendContribsCount = contribs.filter((c) => c.status === 'Pending Verification').length;
    const pendCasesCount = cases.filter((c) => c.status === 'Pending Approval').length;

    switch (role) {
      case 'admin':
        return [
          { id: 'dash', label: 'Overview', icon: <Grid className="ic" /> },
          { id: 'users', label: 'Officers & Access', icon: <Shield className="ic" /> },
          { id: 'settings', label: 'System Settings & Branding', icon: <CogIcon className="ic" /> },
          { id: 'audit', label: 'Audit Log', icon: <Book className="ic" /> },
        ];
      case 'chair':
        return [
          { id: 'dash', label: 'Dashboard', icon: <Grid className="ic" /> },
          {
            id: 'members',
            label: 'Manage Members',
            icon: <Users className="ic" />,
            badge: pendNonChair > 0 ? pendNonChair : undefined,
          },
          { id: 'officers', label: 'Secretary & Treasurer', icon: <Stamp className="ic" /> },
          { id: 'cases', label: 'Welfare Cases', icon: <AlertTriangle className="ic" /> },
          {
            id: 'approvals',
            label: 'Review & Approvals',
            icon: <Stamp className="ic" />,
            badge: pendCasesCount > 0 ? pendCasesCount : undefined,
          },
          { id: 'finance', label: 'Financial Oversight', icon: <BarChart2 className="ic" /> },
          { id: 'meetings', label: 'Meetings & Resolutions', icon: <Calendar className="ic" /> },
          { id: 'reports', label: 'Reports', icon: <FileText className="ic" /> },
          { id: 'rules', label: 'Welfare Rules & Constitution', icon: <BookOpen className="ic" /> },
        ];
      case 'secretary':
        return [
          { id: 'dash', label: 'Dashboard', icon: <Grid className="ic" /> },
          { id: 'register', label: 'Member Registration & Records', icon: <Users className="ic" /> },
          { id: 'cases', label: 'Death & Emergency Cases', icon: <AlertTriangle className="ic" /> },
          { id: 'docs', label: 'Case Documentation', icon: <FileText className="ic" /> },
          { id: 'meetings', label: 'Meetings & Minutes', icon: <Calendar className="ic" /> },
          { id: 'comms', label: 'Announcements', icon: <Megaphone className="ic" /> },
          { id: 'reports', label: 'Administrative Reports', icon: <BarChart2 className="ic" /> },
        ];
      case 'treasurer':
        return [
          { id: 'dash', label: 'Dashboard', icon: <Grid className="ic" /> },
          {
            id: 'contribs',
            label: 'Monthly Contributions',
            icon: <Coins className="ic" />,
            badge: pendContribsCount > 0 ? pendContribsCount : undefined,
          },
          { id: 'payments', label: 'Payment Records', icon: <Book className="ic" /> },
          { id: 'welfare', label: 'Welfare Payment Processing', icon: <Stamp className="ic" /> },
          { id: 'statements', label: 'Financial Statements', icon: <BarChart2 className="ic" /> },
          { id: 'recon', label: 'Payment Reconciliation', icon: <Book className="ic" /> },
          { id: 'audit', label: 'Audit Trail', icon: <Shield className="ic" /> },
        ];
      case 'member':
        return [
          { id: 'dash', label: 'My Dashboard', icon: <Grid className="ic" /> },
          { id: 'profile', label: 'My Profile', icon: <Users className="ic" /> },
          { id: 'contribs', label: 'My Contributions', icon: <Coins className="ic" /> },
          { id: 'assist', label: 'Welfare Assistance', icon: <AlertTriangle className="ic" /> },
          { id: 'beneficiary', label: 'Beneficiary Information', icon: <FileText className="ic" /> },
          { id: 'notifs', label: 'Notifications', icon: <Bell className="ic" /> },
          { id: 'constitution', label: 'Constitution & Welfare Rules', icon: <BookOpen className="ic" /> },
        ];
    }
  };

  // Active user name and avatar info
  const currentMember = members.find((m) => m.id === activeMemberId) || null;
  const currentPersona = () => {
    if (!activeRole) return { name: '', roleTitle: '' };
    if (activeRole === 'member' && currentMember) {
      return { name: currentMember.name, roleTitle: `Member · ${currentMember.school}` };
    }
    const offName = officers[activeRole]?.name || '—';
    const roleTitle = {
      admin: 'System Administrator',
      chair: 'Chairperson',
      secretary: 'Secretary',
      treasurer: 'Treasurer',
      member: 'Member',
    }[activeRole];
    return { name: offName, roleTitle };
  };

  const persona = currentPersona();
  const unreadCount = activeRole
    ? notifications.filter((n) => n.role === activeRole && n.u).length
    : 0;

  return (
    <>
      <ToastContainer toasts={toasts} />

      <CropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        aspectRatio={cropModal.aspect}
        onCancel={() => setCropModal((prev) => ({ ...prev, isOpen: false }))}
        onApply={(dataUrl) => {
          cropModal.cb(dataUrl);
          setCropModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />

      {currentView === 'landing' && (
        <LandingView
          onLogin={handleLogin}
          onOpenRegister={() => setCurrentView('register')}
          logo={brand.logo}
          members={members}
          creds={creds}
          onShowToast={addToast}
        />
      )}

      {currentView === 'register' && (
        <RegisterView
          onBackToLogin={() => setCurrentView('landing')}
          onSubmitRegistration={handleRegisterSubmit}
          logo={brand.logo}
          members={members}
          onOpenCrop={handleOpenCrop}
          onShowToast={addToast}
        />
      )}

      {currentView === 'app' && activeRole && (
        <div id="app">
          <aside>
            <div className="sbrand">
              <Crest size={44} logo={brand.logo} />
              <div>
                <b>KECSHA Welfare</b>
                <small>Kilifi County</small>
              </div>
            </div>

            <nav id="nav">
              <div className="rlab">
                {{
                  admin: 'System Administrator',
                  chair: 'Chairperson',
                  secretary: 'Secretary',
                  treasurer: 'Treasurer',
                  member: 'Member',
                }[activeRole]}{' '}
                portal
              </div>

              {getNavItems(activeRole).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={activePage === item.id ? 'on' : ''}
                  onClick={() => {
                    setActivePage(item.id);
                    setShowBellPanel(false);
                  }}
                >
                  {item.icon} {item.label}
                  {item.badge && <span className="cnt">{item.badge}</span>}
                </button>
              ))}
            </nav>

            <div className="sfoot">
              <div className="zz"></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#48bb78', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: '#b9c9b4', fontWeight: 600 }}>Live Firestore Sync</span>
              </div>
              <p>“Pamoja kwa wanachama — together for the members.”</p>
            </div>
          </aside>

          <main>
            <div className="band"></div>

            <div className="topbar">
              <div className="topin">
                <div className="pghead">
                  <h2>
                    {getNavItems(activeRole).find((i) => i.id === activePage)?.label || 'Dashboard'}
                  </h2>
                  <p>
                    Kilifi County KECSHA Welfare Fund · Real-time synchronized across all devices
                  </p>
                </div>

                <div className="clock">
                  <b>{clockTime}</b>
                  <span>{clockDate}</span>
                </div>

                <div className="bellwrap">
                  <button
                    className="bellbtn"
                    onClick={() => setShowBellPanel(!showBellPanel)}
                    aria-label="Notifications"
                  >
                    <Bell className="ic" />
                    {unreadCount > 0 && <span className="dot">{unreadCount}</span>}
                  </button>

                  {showBellPanel && (
                    <div className="bellpanel">
                      <div
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #f0f2ea',
                        }}
                      >
                        <b style={{ fontSize: '13px' }}>Notifications</b>
                        <button
                          type="button"
                          className="btn sm gho"
                          onClick={async () => {
                            await markNotificationsRead(activeRole, notifications);
                            setShowBellPanel(false);
                            addToast('All notifications marked as read');
                          }}
                        >
                          Mark read
                        </button>
                      </div>
                      {notifications.filter((n) => n.role === activeRole).length > 0 ? (
                        notifications
                          .filter((n) => n.role === activeRole)
                          .map((n, i) => (
                            <div key={n.id || i} className={`bp ${n.u ? 'unread' : ''}`}>
                              {n.txt}
                            </div>
                          ))
                      ) : (
                        <div className="bp" style={{ color: 'var(--mut)', textAlign: 'center' }}>
                          No notifications right now.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="uchip">
                  <div className="av">
                    {currentMember?.photo ? (
                      <img src={currentMember.photo} alt={persona.name} />
                    ) : (
                      initials(persona.name)
                    )}
                  </div>
                  <div>
                    <b>{persona.name}</b>
                    <small>{persona.roleTitle}</small>
                  </div>
                </div>

                <button className="outbtn" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </div>

            <section id="view">
              {activeRole === 'admin' && (
                <AdminPortal
                  page={activePage}
                  members={members}
                  cases={cases}
                  auditLog={auditLog}
                  officers={officers}
                  creds={creds}
                  settings={settings}
                  brand={brand}
                  onApproveChair={handleApproveChair}
                  onDeclineMember={handleDeclineMember}
                  onDeleteChairperson={handleDeleteChairperson}
                  onUpdateAdminPass={async (newHash) => {
                    await updateCreds({
                      ...creds,
                      admin: { ...creds.admin, p: newHash },
                    });
                    await addAuditLog('System Administrator', 'Password changed', 'Admin password updated');
                  }}
                  onSaveSettings={async (newSet) => {
                    await updateSettings(newSet);
                    await addAuditLog(
                      'System Administrator',
                      'Welfare settings updated',
                      `Min: KSh ${newSet.min}, Death: KSh ${newSet.death}, Emer: KSh ${newSet.emer}`
                    );
                  }}
                  onOpenCrop={handleOpenCrop}
                  onSaveBrand={async (newBrand) => {
                    await updateBrand(newBrand);
                    await addAuditLog(
                      'System Administrator',
                      'Branding updated',
                      newBrand.logo ? 'Custom association logo uploaded' : 'Reverted to baobab crest'
                    );
                  }}
                  onShowToast={addToast}
                  onNavigate={(p) => setActivePage(p)}
                />
              )}

              {activeRole === 'chair' && (
                <ChairPortal
                  page={activePage}
                  members={members}
                  contribs={contribs}
                  payouts={payouts}
                  cases={cases}
                  meetings={meetings}
                  officers={officers}
                  settings={settings}
                  onApproveMember={handleApproveMember}
                  onDeclineMember={handleDeclineMember}
                  onDeleteMember={handleDeleteMemberChair}
                  onApproveCase={handleApproveCase}
                  onRejectCase={handleRejectCase}
                  onCountersignContrib={handleCountersignContrib}
                  onApproveMeetingAgenda={async (m) => {
                    await saveMeeting({ ...m, agendaStatus: 'Approved' });
                    await addAuditLog('Chairperson', 'Agenda approved', m.title);
                    addToast(`Agenda approved for ${m.title}`);
                  }}
                  onToggleOfficerStatus={async (offKey) => {
                    const currentStatus = officers[offKey]?.status;
                    const newStatus = currentStatus === 'Active' ? 'On Leave' : 'Active';
                    await updateOfficers({
                      ...officers,
                      [offKey]: { ...officers[offKey], status: newStatus },
                    });
                    await addAuditLog('Chairperson', 'Officer status changed', `${offKey} → ${newStatus}`);
                    addToast(`Officer status changed to ${newStatus}`);
                  }}
                  onSaveSettings={async (newSet) => {
                    await updateSettings(newSet);
                    await addAuditLog(
                      'Chairperson',
                      'Welfare parameters updated',
                      `Min: KSh ${newSet.min}, Death: KSh ${newSet.death}`
                    );
                  }}
                  onNavigate={(p) => setActivePage(p)}
                  onShowToast={addToast}
                />
              )}

              {activeRole === 'secretary' && (
                <SecretaryPortal
                  page={activePage}
                  members={members}
                  cases={cases}
                  meetings={meetings}
                  announcements={announcements}
                  settings={settings}
                  onAddMemberOfficeEntry={async (newM) => {
                    await saveMember(newM);
                    await addAuditLog('Secretary', 'Office entry member registered', `${newM.name} (${newM.id})`);
                    await addNotification({
                      role: 'chair',
                      u: true,
                      txt: `New member registered: ${newM.name} (${newM.id}) awaiting Chairperson approval.`,
                    });
                  }}
                  onVerifyBeneficiary={async (mId) => {
                    const target = members.find((x) => x.id === mId);
                    if (target) {
                      await saveMember({
                        ...target,
                        ben: { ...target.ben, s: 'Verified' },
                      });
                      await addAuditLog('Secretary', 'Beneficiary verified', `${target.name} → ${target.ben.n}`);
                      addToast(`Beneficiary verified for ${target.name}`);
                    }
                  }}
                  onOpenCase={async (newC) => {
                    await saveCase(newC);
                    await addAuditLog('Secretary', 'Welfare case opened', `${newC.id} · ${newC.type}`);
                  }}
                  onToggleDoc={async (caseId, docKey) => {
                    const c = cases.find((x) => x.id === caseId);
                    if (c) {
                      const updatedDocs = { ...c.docs, [docKey]: !c.docs[docKey] };
                      const allDocsIn = Object.values(updatedDocs).every(Boolean);
                      const updatedStatus = allDocsIn && c.status === 'Awaiting Documents'
                        ? 'Pending Approval'
                        : c.status;

                      await saveCase({ ...c, docs: updatedDocs, status: updatedStatus });
                      await addAuditLog('Secretary', 'Document checklist updated', `${c.id} · ${docKey}`);

                      if (allDocsIn && c.status === 'Awaiting Documents') {
                        await addNotification({
                          role: 'chair',
                          u: true,
                          txt: `${c.id} fully documented — pending your approval.`,
                        });
                        addToast(`Case ${c.id} complete — forwarded to Chairperson for approval`);
                      }
                    }
                  }}
                  onAddAgendaItem={async (meetingId, item) => {
                    const m = meetings.find((x) => x.id === meetingId);
                    if (m) {
                      await saveMeeting({ ...m, agenda: [...m.agenda, item] });
                      await addAuditLog('Secretary', 'Agenda item added', item);
                    }
                  }}
                  onSaveMinutesDraft={async (meetingId, minutes) => {
                    const m = meetings.find((x) => x.id === meetingId);
                    if (m) {
                      await saveMeeting({ ...m, minutes });
                      await addAuditLog('Secretary', 'Minutes draft saved', m.title);
                    }
                  }}
                  onSendAnnouncement={async (txt) => {
                    const today = new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
                    await addAnnouncement({ date: today, txt });
                    await addAuditLog('Secretary', 'Announcement issued', txt.slice(0, 50) + '...');
                    await addNotification({ role: 'member', u: true, txt });
                  }}
                  onOpenCrop={handleOpenCrop}
                  onUpdateMemberPhoto={async (mId, photo) => {
                    const target = members.find((x) => x.id === mId);
                    if (target) {
                      await saveMember({ ...target, photo });
                      await addAuditLog('Secretary', 'Member photo updated', `${target.name} (35 × 45 mm)`);
                    }
                  }}
                  onShowToast={addToast}
                />
              )}

              {activeRole === 'treasurer' && (
                <TreasurerPortal
                  page={activePage}
                  members={members}
                  contribs={contribs}
                  payouts={payouts}
                  cases={cases}
                  auditLog={auditLog}
                  settings={settings}
                  onVerifyContrib={handleVerifyContrib}
                  onRejectContrib={handleRejectContrib}
                  onRecordOfficeContrib={handleRecordOfficeContrib}
                  onDisburseCase={handleDisburseCase}
                  onToggleReconciliation={async (c) => {
                    await saveContrib({ ...c, matched: !c.matched });
                    await addAuditLog('Treasurer', 'Reconciliation toggled', `${c.id} (${!c.matched ? 'Matched' : 'Unmatched'})`);
                    addToast(`Receipt ${c.id} marked as ${!c.matched ? 'Matched' : 'Unmatched'}`);
                  }}
                  onShowToast={addToast}
                />
              )}

              {activeRole === 'member' && currentMember && (
                <MemberPortal
                  page={activePage}
                  member={currentMember}
                  allMembers={members}
                  contribs={contribs}
                  cases={cases}
                  announcements={announcements}
                  notifications={notifications}
                  settings={settings}
                  onSubmitContrib={async (newC) => {
                    await saveContrib(newC);
                    await addAuditLog(
                      'Member',
                      'Contribution submitted with proof',
                      `${currentMember.name} · ${newC.month} · KSh ${newC.amt}`
                    );
                    await addNotification({
                      role: 'treasurer',
                      u: true,
                      txt: `${currentMember.name} submitted KSh ${newC.amt.toLocaleString()} (${newC.month}) with receipt evidence awaiting verification.`,
                    });
                  }}
                  onSubmitEmergency={async (newCase) => {
                    await saveCase(newCase);
                    await addAuditLog('Member', 'Emergency request submitted', `${newCase.id} · ${currentMember.name}`);
                    await addNotification({
                      role: 'secretary',
                      u: true,
                      txt: `New emergency request ${newCase.id} from ${currentMember.name}.`,
                    });
                  }}
                  onUpdateBeneficiary={async (newBen) => {
                    await saveMember({ ...currentMember, ben: newBen });
                    await addAuditLog(
                      'Member',
                      'Beneficiary updated',
                      `${currentMember.name} → ${newBen.n}`
                    );
                    await addNotification({
                      role: 'secretary',
                      u: true,
                      txt: `Beneficiary change submitted by ${currentMember.name} awaiting verification.`,
                    });
                  }}
                  onUpdateProfile={async (newPhone, newNokPhone) => {
                    await saveMember({
                      ...currentMember,
                      phone: newPhone,
                      nok: { ...currentMember.nok, p: newNokPhone },
                    });
                    await addAuditLog('Member', 'Contact details updated', currentMember.name);
                  }}
                  onUpdatePhoto={async (newPhoto) => {
                    await saveMember({ ...currentMember, photo: newPhoto });
                    await addAuditLog('Member', 'Photo updated', currentMember.name);
                  }}
                  onOpenCrop={handleOpenCrop}
                  onMarkNotificationsRead={async () => {
                    await markNotificationsRead('member', notifications);
                    addToast('All notifications marked as read');
                  }}
                  onNavigate={(p) => setActivePage(p)}
                  onShowToast={addToast}
                />
              )}
            </section>
          </main>
        </div>
      )}
    </>
  );
}
