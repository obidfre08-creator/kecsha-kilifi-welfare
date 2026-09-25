import React, { useState } from 'react';
import {
  Member,
  WelfareCase,
  AuditEntry,
  Officer,
  Credential,
  WelfareSettings,
  BrandConfig,
} from '../types';
import { StatTile, Pill, PhotoBox, initials, exportToCSV, exportToPDF } from '../utils/helpers';
import { Shield, Users, AlertTriangle, Book, Settings, Camera, Lock, Check, Download, Printer } from 'lucide-react';
import { Crest } from './Crest';
import { sha256 } from '../services/firestoreService';

interface AdminPortalProps {
  page: string;
  members: Member[];
  cases: WelfareCase[];
  auditLog: AuditEntry[];
  officers: Record<string, Officer>;
  creds: Record<string, Credential>;
  settings: WelfareSettings;
  brand: BrandConfig;
  onApproveChair: (member: Member) => void;
  onDeclineMember: (member: Member, reason: string) => void;
  onDeleteChairperson?: (member: Member) => void;
  onUpdateAdminPass: (newHash: string) => Promise<void>;
  onSaveSettings: (settings: WelfareSettings) => Promise<void>;
  onOpenCrop: (src: string, aspect: number, cb: (dataUrl: string) => void) => void;
  onSaveBrand: (brand: BrandConfig) => Promise<void>;
  onShowToast: (msg: string, kind?: 'info' | 'err') => void;
  onNavigate: (page: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  page,
  members,
  cases,
  auditLog,
  officers,
  creds,
  settings,
  brand,
  onApproveChair,
  onDeclineMember,
  onDeleteChairperson,
  onUpdateAdminPass,
  onSaveSettings,
  onOpenCrop,
  onSaveBrand,
  onShowToast,
  onNavigate,
}) => {
  // Password form state
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Settings form state
  const [formSettings, setFormSettings] = useState<WelfareSettings>(settings);

  const pendChair = members.filter(
    (m) => m.status === 'Pending Verification' && m.position === 'Chairperson'
  );

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const curH = await sha256(curPass);
    const storedH = creds.admin?.p || '';

    if (storedH !== curH && storedH !== curPass) {
      onShowToast('Current administrator password is incorrect', 'err');
      return;
    }
    if (newPass.length < 6) {
      onShowToast('New password must be at least 6 characters', 'err');
      return;
    }
    if (newPass !== confirmPass) {
      onShowToast('New passwords do not match', 'err');
      return;
    }

    const newH = await sha256(newPass);
    await onUpdateAdminPass(newH);
    setCurPass('');
    setNewPass('');
    setConfirmPass('');
    onShowToast('Administrator password updated successfully');
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(formSettings);
    onShowToast('System settings updated and synced to Firestore');
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onOpenCrop(reader.result, 1, async (cropped) => {
            await onSaveBrand({ logo: cropped });
            onShowToast('Custom association logo uploaded and applied system-wide');
          });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleResetLogo = async () => {
    await onSaveBrand({ logo: null });
    onShowToast('Reverted to default baobab crest');
  };

  const handleExportCSV = (type: string) => {
    let csv = '';
    if (type === 'audit') {
      csv = 'Time,Actor,Action,Detail\n' +
        auditLog.map((a) => `"${a.t}","${a.who}","${a.act}","${a.det}"`).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kilifi-kecsha-${type}-${Date.now()}.csv`;
    a.click();
    onShowToast(`Exported ${type} data as CSV`);
  };

  return (
    <div>
      {page === 'dash' && (
        <>
          <div className="tiles">
            <StatTile
              icon={<Shield className="ic" />}
              label="Officers Active"
              val={['chair', 'secretary', 'treasurer'].filter((k) => officers[k]?.status === 'Active').length}
              sub="of 3 association offices"
              tone="var(--green)"
            />
            <StatTile
              icon={<Users className="ic" />}
              label="Active Members"
              val={members.filter((m) => m.status === 'Active').length}
              sub={`${members.filter((m) => m.status === 'Pending Verification').length} registration(s) pending`}
              tone="var(--blue)"
            />
            <StatTile
              icon={<AlertTriangle className="ic" />}
              label="Open Welfare Cases"
              val={cases.filter((c) => c.status !== 'Paid' && c.status !== 'Rejected').length}
              sub="in the approval pipeline"
              tone="var(--red)"
            />
            <StatTile
              icon={<Book className="ic" />}
              label="Audit Events"
              val={auditLog.length}
              sub="traceable system actions in Firestore"
              tone="var(--goldD)"
            />
          </div>

          <div className="panel rv">
            <h3>
              <Shield className="ic" /> Chairperson approval — Administrator's duty
            </h3>
            <p className="psub">
              The Chairperson registers through the member registration form (with 35 × 45 mm photo). You approve and activate them here; their login credentials come from their registration. All other members, the Secretary and Treasurer are approved by the Chairperson.
            </p>
            {pendChair.length > 0 ? (
              pendChair.map((m) => (
                <div key={m.id} className="offc" style={{ alignItems: 'flex-start' }}>
                  <div className="oav">
                    {m.photo ? <img src={m.photo} alt={m.name} /> : initials(m.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <b>{m.name}</b> <span className="pill p-b">{m.position}</span> <Pill status={m.status} />
                    <small>{m.school} · {m.id}</small>
                    <small>
                      TSC <b className="mono">{m.tsc}</b> · ID <b className="mono">{m.idno}</b> · {m.phone}
                    </small>
                    <small>
                      Login username: <b className="mono">{m.user}</b>
                    </small>
                    <small>
                      Beneficiary: <b>{m.ben.n}</b> · ID {m.ben.id} · {m.ben.r} · photo {m.ben.photo ? '✓' : '✗'}
                    </small>
                    <small>
                      Scanned ID: {m.scan ? <a href={m.scan} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>view scan ✓</a> : 'missing ✗'}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => onApproveChair(m)}
                    >
                      Approve & activate
                    </button>
                    <button
                      type="button"
                      className="btn dng sm"
                      onClick={() => {
                        const r = prompt('Reason for declining registration:');
                        if (r) onDeclineMember(m, r);
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                <p>No Chairperson registration pending.</p>
                {officers.chair?.status === 'Active' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', background: '#F8F9F5', padding: '12px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    <div style={{ flex: 1 }}>
                      Current active chairperson: <b>{officers.chair.name}</b>
                    </div>
                    {onDeleteChairperson && (
                      <button
                        type="button"
                        className="btn dng sm"
                        onClick={() => {
                          const chairObj = members.find(m => m.position === 'Chairperson' && m.status === 'Active');
                          if (chairObj && confirm(`Are you sure you want to delete Chairperson ${chairObj.name}? This will remove their account and vacate the office.`)) {
                            onDeleteChairperson(chairObj);
                          } else if (!chairObj) {
                            onShowToast('Chairperson member record not found', 'err');
                          }
                        }}
                      >
                        Delete Chairperson
                      </button>
                    )}
                  </div>
                ) : (
                  <p style={{ marginTop: '6px' }}>The office is currently <b>Vacant</b>.</p>
                )}
              </div>
            )}
          </div>

          <div className="panel rv">
            <h3>Access hierarchy & authority flow</h3>
            <p className="psub">
              Financial approval, payment authorisation and audit access are strictly separated.
            </p>
            <div className="flow">
              <div className="fstep">
                <b>System Administrator</b>
                <span>Approves Chairperson · branding · settings</span>
              </div>
              <div className="fstep">
                <b>Chairperson</b>
                <span>Approves Secretary, Treasurer & members · approves assistance</span>
              </div>
              <div className="fstep">
                <b>Secretary</b>
                <span>Documents registrations & records · cases & meetings</span>
              </div>
              <div className="fstep">
                <b>Treasurer</b>
                <span>Verifies contribution proofs & executes authorised payments</span>
              </div>
              <div className="fstep">
                <b>Members</b>
                <span>Contribute with proofs, claim & view own records</span>
              </div>
            </div>
          </div>

          <div className="grid2">
            <div className="panel rv">
              <h3>
                <Camera className="ic" /> Branding status
              </h3>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <Crest size={58} logo={brand.logo} />
                <div style={{ fontSize: '13.5px' }}>
                  <b>Association logo</b>
                  <div style={{ color: 'var(--mut)' }}>
                    {brand.logo ? 'Custom logo active system-wide' : 'Default crest — upload in System Settings'}
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn gho sm"
                      onClick={() => onNavigate('settings')}
                    >
                      <Settings className="ic" /> Open settings
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel rv">
              <h3>
                <Users className="ic" /> Registration activity
              </h3>
              {members.filter((m) => m.status === 'Pending Verification').length > 0 ? (
                members
                  .filter((m) => m.status === 'Pending Verification')
                  .slice(0, 4)
                  .map((m) => (
                    <div key={m.id} className="offc">
                      <div className="oav">
                        {m.photo ? <img src={m.photo} alt={m.name} /> : initials(m.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <b>{m.name}</b>
                        <small>
                          {m.school} · applied as {m.position} ·{' '}
                          {m.position === 'Chairperson' ? 'your approval' : 'Chairperson’s approval'} required
                        </small>
                      </div>
                      <Pill status={m.status} />
                    </div>
                  ))
              ) : (
                <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                  No registrations awaiting approval.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {page === 'users' && (
        <>
          <div className="panel rv">
            <h3>Approve & activate Chairperson</h3>
            <p className="psub">
              The Chairperson registers like any other member. On approval, their registration username & password become their login.
            </p>
            {pendChair.length > 0 ? (
              pendChair.map((m) => (
                <div key={m.id} className="offc" style={{ alignItems: 'flex-start' }}>
                  <div className="oav">
                    {m.photo ? <img src={m.photo} alt={m.name} /> : initials(m.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <b>{m.name}</b> <span className="pill p-b">{m.position}</span> <Pill status={m.status} />
                    <small>{m.school} · {m.id}</small>
                    <small>TSC: {m.tsc} · ID: {m.idno} · {m.phone}</small>
                    <small>Username: <b className="mono">{m.user}</b></small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => onApproveChair(m)}
                    >
                      Approve & activate
                    </button>
                    <button
                      type="button"
                      className="btn dng sm"
                      onClick={() => {
                        const r = prompt('Reason:');
                        if (r) onDeclineMember(m, r);
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                No Chairperson registration pending.
              </p>
            )}
          </div>

          <div className="panel rv">
            <h3>Officer register & login credentials</h3>
            {(['chair', 'secretary', 'treasurer', 'admin'] as const).map((k) => {
              const o = officers[k] || { name: 'Vacant', status: 'Vacant' };
              const roleTitle = {
                chair: 'Chairperson',
                secretary: 'Secretary',
                treasurer: 'Treasurer',
                admin: 'System Administrator',
              }[k];
              const cr = creds[k] || { u: '—', p: '—' };
              const mm = members.find((x) => x.role === roleTitle);

              return (
                <div key={k} className="offc">
                  <div className="oav">
                    {mm && mm.photo ? <img src={mm.photo} alt={o.name} /> : initials(o.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <b>{o.name}</b>
                    {mm && (
                      <small>
                        TSC {mm.tsc} · ID {mm.idno} · {mm.school}
                      </small>
                    )}
                    <small>
                      {k === 'admin'
                        ? 'System access, branding & settings'
                        : k === 'chair'
                        ? 'Association leadership — approved by Administrator'
                        : k === 'secretary'
                        ? 'Records, cases & meetings — approved by Chairperson'
                        : 'Contributions & payments — approved by Chairperson'}
                    </small>
                    <div className="credrow">
                      <Lock className="ic" style={{ display: 'inline', width: '13px' }} /> Login — username:{' '}
                      <b className="mono">{cr.u}</b> · password:{' '}
                      <b className="mono">{cr.p.length > 12 ? '••••••••' : cr.p}</b>
                      {k === 'admin'
                        ? ' · change it in System Settings'
                        : cr.u === '—'
                        ? ' · not issued yet'
                        : ''}
                    </div>
                  </div>
                  <Pill status={o.status} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {page === 'settings' && (
        <>
          <div className="panel rv">
            <h3>Change administrator password</h3>
            <p className="psub">
              Signed in as <b className="mono">{creds.admin?.u || 'admin@kecsha.co.ke'}</b>. The default password <b className="mono">admin123</b> should be changed.
            </p>
            <form className="form" onSubmit={handlePasswordSubmit}>
              <div className="field">
                <label>Current password</label>
                <input
                  type="password"
                  value={curPass}
                  onChange={(e) => setCurPass(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>New password</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Confirm new password</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn pri">
                Update password
              </button>
            </form>
          </div>

          <div className="panel rv">
            <h3>Association branding — logo upload</h3>
            <p className="psub">
              Upload the official association logo. It replaces the default crest everywhere. Cropped to a square in your browser.
            </p>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '12px', background: '#FDFDF9' }}>
                <Crest size={72} logo={brand.logo} />
              </div>
              <div>
                <div className="actions" style={{ marginTop: 0 }}>
                  <button type="button" className="btn pri" onClick={handleLogoUpload}>
                    <Camera className="ic" /> Upload & crop logo
                  </button>
                  {brand.logo && (
                    <button type="button" className="btn dng sm" onClick={handleResetLogo}>
                      Reset to default crest
                    </button>
                  )}
                </div>
                <small style={{ color: 'var(--mut)', display: 'block', marginTop: '8px' }}>
                  Current: {brand.logo ? 'Custom logo applied system-wide' : 'Default baobab crest'}
                </small>
              </div>
            </div>
          </div>

          <div className="panel rv">
            <h3>System settings</h3>
            <p className="psub">
              Changes are saved directly to Firestore database. Minimum monthly contribution and benefit figures mirror Schedule 1 of the constitution.
            </p>
            <form className="form" onSubmit={handleSettingsSubmit}>
              <div className="field">
                <label>Minimum monthly contribution (KSh)</label>
                <input
                  type="number"
                  min="1"
                  value={formSettings.min}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, min: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Death benefit (KSh)</label>
                <input
                  type="number"
                  value={formSettings.death}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, death: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Emergency cap (KSh)</label>
                <input
                  type="number"
                  value={formSettings.emer}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, emer: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Dual financial control</label>
                <select
                  value={formSettings.dual ? 'Required' : 'Off'}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, dual: e.target.value === 'Required' })
                  }
                >
                  <option value="Required">Required</option>
                  <option value="Off">Off</option>
                </select>
              </div>
              <button type="submit" className="btn pri">
                Save settings
              </button>
            </form>
          </div>
        </>
      )}

      {page === 'audit' && (
        <div className="panel rv">
          <h3>Audit log — every consequential action</h3>
          <p className="psub">
            Immutable, time-stamped, actor-attributed records stored in Firestore.
          </p>
          <div className="twrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((a, i) => (
                  <tr key={a.id || i}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                      {a.t}
                    </td>
                    <td>
                      <b>{a.who}</b>
                    </td>
                    <td>{a.act}</td>
                    <td style={{ color: 'var(--mut)' }}>{a.det}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => handleExportCSV('audit')}
            >
              <Download className="ic" style={{ width: '14px' }} /> Download Excel / CSV
            </button>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => exportToPDF('Audit Log')}
            >
              <Printer className="ic" style={{ width: '14px' }} /> Download PDF / Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
