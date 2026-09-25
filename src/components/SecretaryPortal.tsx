import React, { useState } from 'react';
import {
  Member,
  WelfareCase,
  Meeting,
  Announcement,
  WelfareSettings,
} from '../types';
import {
  StatTile,
  Pill,
  PhotoBox,
  initials,
  money,
  todayStr,
} from '../utils/helpers';
import { Users, AlertTriangle, Calendar, Megaphone, FileText, Camera, Check } from 'lucide-react';
import { sha256 } from '../services/firestoreService';

interface SecretaryPortalProps {
  page: string;
  members: Member[];
  cases: WelfareCase[];
  meetings: Meeting[];
  announcements: Announcement[];
  settings: WelfareSettings;
  onAddMemberOfficeEntry: (member: Member) => Promise<void>;
  onVerifyBeneficiary: (memberId: string) => Promise<void>;
  onOpenCase: (welfareCase: WelfareCase) => Promise<void>;
  onToggleDoc: (caseId: string, docKey: string) => Promise<void>;
  onAddAgendaItem: (meetingId: string, item: string) => Promise<void>;
  onSaveMinutesDraft: (meetingId: string, minutes: string) => Promise<void>;
  onSendAnnouncement: (text: string) => Promise<void>;
  onOpenCrop: (src: string, aspect: number, cb: (dataUrl: string) => void) => void;
  onUpdateMemberPhoto: (memberId: string, photoDataUrl: string) => Promise<void>;
  onShowToast: (msg: string, kind?: 'info' | 'err') => void;
}

export const SecretaryPortal: React.FC<SecretaryPortalProps> = ({
  page,
  members,
  cases,
  meetings,
  announcements,
  settings,
  onAddMemberOfficeEntry,
  onVerifyBeneficiary,
  onOpenCase,
  onToggleDoc,
  onAddAgendaItem,
  onSaveMinutesDraft,
  onSendAnnouncement,
  onOpenCrop,
  onUpdateMemberPhoto,
  onShowToast,
}) => {
  // New member form
  const [mName, setMName] = useState('');
  const [mTsc, setMTsc] = useState('');
  const [mIdno, setMIdno] = useState('');
  const [mSchool, setMSchool] = useState('');
  const [mPhone, setMPhone] = useState('');

  // Open case form
  const [caseType, setCaseType] = useState('Death Benefit');
  const [caseMember, setCaseMember] = useState(members[0]?.id || '');
  const [caseAmt, setCaseAmt] = useState(settings.death);
  const [caseDesc, setCaseDesc] = useState('');

  // Agenda & minutes
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [minutesText, setMinutesText] = useState(meetings[0]?.minutes || '');

  // Announcement
  const [annText, setAnnText] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const pendDocsCases = cases.filter((c) => c.status === 'Awaiting Documents');
  const pendingBeneficiaries = members.filter((m) => m.ben.s === 'Pending Verification');

  const handleRegisterOfficeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName || !mSchool) {
      onShowToast('Name and school are required', 'err');
      return;
    }

    const nextId = `KCW-${String(members.length + 1).padStart(3, '0')}`;
    const defaultPass = await sha256('kecsha2026');

    const newM: Member = {
      id: nextId,
      name: mName.trim(),
      school: mSchool.trim(),
      phone: mPhone.trim() || '—',
      tsc: mTsc.trim() || '—',
      idno: mIdno.trim() || '—',
      position: 'Member',
      role: '—',
      joined: '—',
      status: 'Pending Verification',
      months: 0,
      total: 0,
      photo: null,
      scan: null,
      user: nextId.toLowerCase(),
      pass: defaultPass,
      ben: {
        n: 'None on file',
        id: '—',
        r: '—',
        p: '—',
        photo: null,
        s: 'Not Registered',
      },
      nok: {
        n: '—',
        id: '—',
        p: '—',
      },
    };

    await onAddMemberOfficeEntry(newM);
    setMName('');
    setMTsc('');
    setMIdno('');
    setMSchool('');
    setMPhone('');
    onShowToast(`Member <b>${newM.name}</b> registered as ${nextId} — awaiting Chairperson's approval`);
  };

  const handleOpenCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selMember = members.find((m) => m.id === caseMember);
    const memberLabel = selMember ? `${selMember.name} (${selMember.id})` : caseMember;

    const caseId = `WC-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, '0')}`;
    const initialDocs: Record<string, boolean> = caseType.startsWith('Death')
      ? {
          'Death Certificate': false,
          'Burial Permit': false,
          'Beneficiary ID': false,
          "Chief's Letter": false,
        }
      : {
          'Supporting Hospital / Disaster Report': false,
          'ID Copy': true,
        };

    const newC: WelfareCase = {
      id: caseId,
      type: caseType,
      member: memberLabel,
      ben: caseType.startsWith('Death') ? selMember?.ben.n || 'Written Beneficiary' : 'Self',
      amt: caseAmt,
      status: 'Awaiting Documents',
      opened: todayStr(),
      note: caseDesc,
      docs: initialDocs,
    };

    await onOpenCase(newC);
    setCaseDesc('');
    onShowToast(`Welfare case <b>${caseId}</b> opened and saved to database`);
  };

  const handleMemberPhotoUpload = (mId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onOpenCrop(reader.result, 45 / 35, async (cropped) => {
            await onUpdateMemberPhoto(mId, cropped);
            onShowToast('35 × 45 mm photo saved for member');
          });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const filtered = members.filter((m) => {
    if (m.status === 'Declined') return false;
    const q = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.school.toLowerCase().includes(q) ||
      m.tsc.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {page === 'dash' && (
        <>
          <div className="tiles">
            <StatTile
              icon={<Users className="ic" />}
              label="Registered Members"
              val={members.filter((m) => m.status !== 'Declined').length}
              sub={`${members.filter((m) => m.status === 'Active').length} active · ${members.filter((m) => m.status === 'Pending Verification').length} pending`}
              tone="var(--green)"
            />
            <StatTile
              icon={<AlertTriangle className="ic" />}
              label="Pending Cases"
              val={pendDocsCases.length}
              sub="awaiting documentation"
              tone="var(--red)"
            />
            <StatTile
              icon={<Calendar className="ic" />}
              label="Upcoming Meetings"
              val={meetings.length}
              sub="scheduled"
              tone="var(--blue)"
            />
            <StatTile
              icon={<Megaphone className="ic" />}
              label="Announcements"
              val={announcements.length}
              sub="notices broadcasted"
              tone="var(--goldD)"
            />
          </div>

          <div className="panel rv">
            <h3>Cases needing documentation</h3>
            <p className="psub">
              Follow up with members or beneficiaries to collect required certificates.
            </p>
            {pendDocsCases.length > 0 ? (
              pendDocsCases.map((c) => (
                <div key={c.id} className="caserow">
                  <div className="ch">
                    <b>{c.id}</b> <span className="pill p-b">{c.type}</span>
                    <Pill status={c.status} />
                    <span className="amt">{money(c.amt)}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                    {c.member} · Opened {c.opened}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {Object.keys(c.docs || {}).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={`docchip ${c.docs[k] ? 'ok' : ''}`}
                        onClick={() => onToggleDoc(c.id, k)}
                      >
                        {c.docs[k] ? '✓' : '○'} {k}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                All current cases are documented.
              </p>
            )}
          </div>
        </>
      )}

      {page === 'register' && (
        <>
          <div className="grid2">
            <div className="panel rv">
              <h3>
                <Users className="ic" /> Register new member (Office entry)
              </h3>
              <p className="psub">
                For in-person member registrations. Activation completes after Chairperson approval.
              </p>
              <form className="form" onSubmit={handleRegisterOfficeEntry}>
                <div className="field">
                  <label>Full name *</label>
                  <input
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    placeholder="e.g., Mary W. Kamau"
                    required
                  />
                </div>
                <div className="field">
                  <label>TSC number</label>
                  <input
                    value={mTsc}
                    onChange={(e) => setMTsc(e.target.value)}
                    placeholder="e.g., 1234567"
                  />
                </div>
                <div className="field">
                  <label>National ID number</label>
                  <input
                    value={mIdno}
                    onChange={(e) => setMIdno(e.target.value)}
                    placeholder="e.g., 23456789"
                  />
                </div>
                <div className="field">
                  <label>School *</label>
                  <input
                    value={mSchool}
                    onChange={(e) => setMSchool(e.target.value)}
                    placeholder="e.g., Vipingo Primary"
                    required
                  />
                </div>
                <div className="field">
                  <label>Phone number</label>
                  <input
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                  />
                </div>
                <button type="submit" className="btn pri">
                  Register member
                </button>
              </form>
            </div>

            <div className="panel rv">
              <h3>Beneficiary nominations to verify</h3>
              <p className="psub">Verify Article 7 nomination details and photos.</p>
              {pendingBeneficiaries.length > 0 ? (
                pendingBeneficiaries.map((m) => (
                  <div key={m.id} className="caserow">
                    <div className="ch">
                      <b>{m.name}</b> <Pill status={m.ben.s} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                      Nominee: <b>{m.ben.n}</b> ({m.ben.r}) · ID: {m.ben.id}
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn gld sm"
                        onClick={() => onVerifyBeneficiary(m.id)}
                      >
                        Verify nomination
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                  All beneficiary nominations verified.
                </p>
              )}
            </div>
          </div>

          <div className="panel rv">
            <h3>Membership register & 35 × 45 mm photos</h3>
            <input
              style={{
                padding: '9px 12px',
                border: '1px solid var(--line)',
                borderRadius: '9px',
                maxWidth: '320px',
                marginBottom: '12px',
                display: 'block',
              }}
              placeholder="Search name, school, TSC or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>No.</th>
                    <th>Member</th>
                    <th>School</th>
                    <th>TSC</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Beneficiary</th>
                    <th>Photo action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <PhotoBox member={m} />
                      </td>
                      <td className="mono">{m.id}</td>
                      <td>
                        <b>{m.name}</b>
                      </td>
                      <td>{m.school}</td>
                      <td className="mono">{m.tsc}</td>
                      <td className="mono">{m.phone}</td>
                      <td>
                        <Pill status={m.status} />
                      </td>
                      <td>
                        {m.ben.n} <Pill status={m.ben.s} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn gho sm"
                          onClick={() => handleMemberPhotoUpload(m.id)}
                        >
                          <Camera className="ic" /> {m.photo ? 'Replace' : 'Upload'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {page === 'cases' && (
        <div className="grid2">
          <div className="panel rv">
            <h3>Open a welfare case</h3>
            <form className="form" onSubmit={handleOpenCaseSubmit}>
              <div className="field">
                <label>Case type</label>
                <select
                  value={caseType}
                  onChange={(e) => {
                    setCaseType(e.target.value);
                    if (e.target.value.startsWith('Death')) {
                      setCaseAmt(settings.death);
                    } else {
                      setCaseAmt(settings.emer);
                    }
                  }}
                >
                  <option value="Death Benefit">Death Benefit</option>
                  <option value="Emergency — Hospitalisation">Emergency — Hospitalisation</option>
                  <option value="Emergency — Fire / Disaster">Emergency — Fire / Disaster</option>
                  <option value="Emergency — Bereavement">Emergency — Bereavement</option>
                </select>
              </div>

              <div className="field">
                <label>Member</label>
                <select
                  value={caseMember}
                  onChange={(e) => setCaseMember(e.target.value)}
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Amount (KSh)</label>
                <input
                  type="number"
                  value={caseAmt}
                  onChange={(e) => setCaseAmt(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Brief description</label>
                <textarea
                  rows={3}
                  value={caseDesc}
                  onChange={(e) => setCaseDesc(e.target.value)}
                  placeholder="Details of the incident or claim..."
                  required
                />
              </div>

              <button type="submit" className="btn pri">
                Open case
              </button>
            </form>
          </div>

          <div className="panel rv">
            <h3>Case pipeline overview</h3>
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Awaiting documents</td>
                    <td className="mono">{cases.filter((c) => c.status === 'Awaiting Documents').length}</td>
                  </tr>
                  <tr>
                    <td>Pending approval</td>
                    <td className="mono">{cases.filter((c) => c.status === 'Pending Approval').length}</td>
                  </tr>
                  <tr>
                    <td>Approved for payment</td>
                    <td className="mono">{cases.filter((c) => c.status === 'Approved for Payment').length}</td>
                  </tr>
                  <tr>
                    <td>Paid / Closed</td>
                    <td className="mono">{cases.filter((c) => c.status === 'Paid').length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {page === 'docs' && (
        <div className="panel rv">
          <h3>Case documentation checklist</h3>
          <p className="psub">
            Tick off received documents. When all required documents are confirmed, the case automatically advances to the Chairperson for payment approval.
          </p>
          {cases.map((c) => (
            <div key={c.id} className="caserow">
              <div className="ch">
                <b>{c.id}</b> <span className="pill p-b">{c.type}</span>
                <Pill status={c.status} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mut)', marginBottom: '8px' }}>
                {c.member} · {money(c.amt)}
              </div>
              <div className="actions">
                {Object.keys(c.docs || {}).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`btn sm ${c.docs[k] ? 'pri' : 'gho'}`}
                    onClick={() => onToggleDoc(c.id, k)}
                  >
                    {c.docs[k] ? '✓' : '○'} {k}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {page === 'meetings' && (
        <div className="grid2">
          <div className="panel rv">
            <h3>Agenda builder — {meetings[0]?.title || 'Association Meeting'}</h3>
            <p className="psub">
              {meetings[0]?.date} · {meetings[0]?.venue} · Status: <Pill status={meetings[0]?.agendaStatus || 'Draft'} />
            </p>
            <ol style={{ paddingLeft: '20px', fontSize: '14px', marginBottom: '14px' }}>
              {(meetings[0]?.agenda || []).map((a, i) => (
                <li key={i} style={{ marginBottom: '5px' }}>
                  {a}
                </li>
              ))}
            </ol>
            <form
              className="form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (newAgendaItem.trim() && meetings[0]) {
                  await onAddAgendaItem(meetings[0].id, newAgendaItem.trim());
                  setNewAgendaItem('');
                  onShowToast('Agenda item added');
                }
              }}
            >
              <div className="field">
                <label>Add agenda item</label>
                <input
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  placeholder="e.g., Audit committee formation"
                  required
                />
              </div>
              <button type="submit" className="btn gld sm">
                Add
              </button>
            </form>
          </div>

          <div className="panel rv">
            <h3>Minutes draft</h3>
            <form
              className="form full"
              onSubmit={async (e) => {
                e.preventDefault();
                if (meetings[0]) {
                  await onSaveMinutesDraft(meetings[0].id, minutesText);
                  onShowToast('Minutes draft saved to database');
                }
              }}
            >
              <div className="field">
                <label>Record or amend minutes</label>
                <textarea
                  rows={7}
                  value={minutesText}
                  onChange={(e) => setMinutesText(e.target.value)}
                  placeholder="Type proceedings and resolutions..."
                />
              </div>
              <button type="submit" className="btn pri sm">
                Save minutes draft
              </button>
            </form>
          </div>
        </div>
      )}

      {page === 'comms' && (
        <div className="grid2">
          <div className="panel rv">
            <h3>Compose announcement</h3>
            <p className="psub">Synchronizes live to all members across devices.</p>
            <form
              className="form full"
              onSubmit={async (e) => {
                e.preventDefault();
                if (annText.trim()) {
                  await onSendAnnouncement(annText.trim());
                  setAnnText('');
                  onShowToast('Announcement broadcasted to all members');
                }
              }}
            >
              <div className="field">
                <label>Notice text</label>
                <textarea
                  rows={4}
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="e.g., Reminder: Monthly contributions due on the 5th via Paybill..."
                  required
                />
              </div>
              <button type="submit" className="btn pri">
                <Megaphone className="ic" /> Send announcement
              </button>
            </form>
          </div>

          <div className="panel rv">
            <h3>Recent communications</h3>
            {announcements.length > 0 ? (
              announcements.map((a, i) => (
                <div key={a.id || i} className="ann">
                  <small>{a.date} · Secretary's office</small>
                  {a.txt}
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                No announcements sent yet.
              </p>
            )}
          </div>
        </div>
      )}

      {page === 'reports' && (
        <div className="grid3">
          <div className="panel rv">
            <h3>Member Registry Summary</h3>
            <p className="psub">Full list of active and pending members with schools.</p>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => {
                const csv = 'ID,Name,School,Status\n' +
                  members.map((m) => `"${m.id}","${m.name}","${m.school}","${m.status}"`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `secretary-members-${Date.now()}.csv`;
                a.click();
                onShowToast('Exported CSV');
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
