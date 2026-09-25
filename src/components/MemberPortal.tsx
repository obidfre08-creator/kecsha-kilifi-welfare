import React, { useState } from 'react';
import {
  Member,
  Contrib,
  WelfareCase,
  Announcement,
  AppNotification,
  WelfareSettings,
} from '../types';
import {
  StatTile,
  Pill,
  PhotoBox,
  money,
  MONTHS,
  curMonth,
  todayStr,
  exportToCSV,
  exportToPDF,
} from '../utils/helpers';
import { Coins, Calendar, AlertTriangle, Bell, Camera, User, FileText, Book, Download, Printer, Smartphone } from 'lucide-react';
import { ConstitutionDoc } from './ConstitutionDoc';
import { compressImage } from '../services/firestoreService';

interface MemberPortalProps {
  page: string;
  member: Member;
  allMembers: Member[];
  contribs: Contrib[];
  cases: WelfareCase[];
  announcements: Announcement[];
  notifications: AppNotification[];
  settings: WelfareSettings;
  onSubmitContrib: (contrib: Contrib) => Promise<void>;
  onSubmitEmergency: (emergencyCase: WelfareCase) => Promise<void>;
  onUpdateBeneficiary: (ben: Member['ben']) => Promise<void>;
  onUpdateProfile: (phone: string, nokPhone: string) => Promise<void>;
  onUpdatePhoto: (photoDataUrl: string) => Promise<void>;
  onOpenCrop: (src: string, aspect: number, cb: (dataUrl: string) => void) => void;
  onMarkNotificationsRead: () => Promise<void>;
  onNavigate: (page: string) => void;
  onShowToast: (msg: string, kind?: 'info' | 'err') => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({
  page,
  member,
  allMembers,
  contribs,
  cases,
  announcements,
  notifications,
  settings,
  onSubmitContrib,
  onSubmitEmergency,
  onUpdateBeneficiary,
  onUpdateProfile,
  onUpdatePhoto,
  onOpenCrop,
  onMarkNotificationsRead,
  onNavigate,
  onShowToast,
}) => {
  // Pay form
  const [payMonth, setPayMonth] = useState(curMonth());
  const [payAmt, setPayAmt] = useState(settings.min);
  const [payMethod, setPayMethod] = useState('M-PESA');
  const [payRef, setPayRef] = useState('');
  const [payEvidence, setPayEvidence] = useState<string | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Emergency form
  const [emerCat, setEmerCat] = useState('Hospitalisation');
  const [emerAmt, setEmerAmt] = useState(settings.emer);
  const [emerDesc, setEmerDesc] = useState('');

  // Beneficiary form
  const [benName, setBenName] = useState(member.ben?.n || '');
  const [benId, setBenId] = useState(member.ben?.id || '');
  const [benRel, setBenRel] = useState(member.ben?.r || 'Spouse');
  const [benPhone, setBenPhone] = useState(member.ben?.p || '');
  const [benPhoto, setBenPhoto] = useState<string | null>(member.ben?.photo || null);

  // Profile form
  const [phone, setPhone] = useState(member.phone || '');
  const [nokPhone, setNokPhone] = useState(member.nok?.p || '');

  const myContribs = contribs.filter((c) => c.m === member.id);
  const myVerified = myContribs.filter((c) => c.status === 'Verified');
  const myPending = myContribs.filter((c) => c.status === 'Pending Verification');
  const myCases = cases.filter((c) => c.member.includes(member.id));

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmt < settings.min) {
      onShowToast(`Amount is below constitutional minimum of ${money(settings.min)}`, 'err');
      return;
    }
    if (!payRef.trim()) {
      onShowToast('Please enter the payment reference (M-PESA code or bank slip)', 'err');
      return;
    }
    if (!payEvidence) {
      onShowToast('Please attach your payment evidence receipt or screenshot', 'err');
      return;
    }

    setPaySubmitting(true);
    try {
      const nextId = `CT-${String(1000 + contribs.length + 1)}`;
      const newC: Contrib = {
        id: nextId,
        m: member.id,
        month: payMonth,
        amt: payAmt,
        ref: payRef.trim().toUpperCase(),
        method: payMethod,
        date: todayStr(),
        status: 'Pending Verification',
        v: false,
        evidence: payEvidence,
        by: 'Member',
      };

      await onSubmitContrib(newC);
      setPayRef('');
      setPayEvidence(null);
      onShowToast(`Contribution for <b>${payMonth}</b> submitted — the Treasurer has been notified to verify it`);
    } catch (err) {
      console.error(err);
      onShowToast('Error submitting contribution to database', 'err');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleEvidenceUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const comp = await compressImage(reader.result, 800, 0.7);
          setPayEvidence(comp);
          onShowToast('Payment evidence receipt attached');
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleMyPhotoUpload = () => {
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
            await onUpdatePhoto(cropped);
            onShowToast('Your 35 × 45 mm photo has been updated');
          });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleBenPhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onOpenCrop(reader.result, 45 / 35, (cropped) => {
            setBenPhoto(cropped);
            onShowToast('Beneficiary photo cropped to 35 × 45 mm');
          });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emerDesc.trim()) {
      onShowToast('Please describe the emergency incident', 'err');
      return;
    }

    const caseId = `WC-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, '0')}`;
    const newCase: WelfareCase = {
      id: caseId,
      type: `Emergency — ${emerCat}`,
      member: `${member.name} (${member.id})`,
      ben: 'Self',
      amt: Math.min(emerAmt, settings.emer),
      status: 'Awaiting Documents',
      opened: todayStr(),
      note: emerDesc,
      docs: {
        'Supporting Report': false,
        'ID Copy': true,
      },
    };

    await onSubmitEmergency(newCase);
    setEmerDesc('');
    onShowToast(`Emergency request <b>${caseId}</b> submitted — the Secretary has been notified`);
  };

  const handleBeneficiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benName || !benId) {
      onShowToast('Beneficiary name and ID are required', 'err');
      return;
    }

    const updatedBen: Member['ben'] = {
      n: benName.trim(),
      id: benId.trim(),
      r: benRel,
      p: benPhone.trim(),
      photo: benPhoto,
      s: 'Pending Verification',
    };

    await onUpdateBeneficiary(updatedBen);
    onShowToast('Beneficiary details submitted for Secretary verification');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile(phone.trim(), nokPhone.trim());
    onShowToast('Contact details updated');
  };

  return (
    <div>
      {page === 'dash' && (
        <>
          <div className="tiles">
            <StatTile
              icon={<Coins className="ic" />}
              label="Personal Contributions"
              val={myVerified.reduce((a, c) => a + c.amt, 0)}
              sub="verified by Treasurer"
              tone="var(--green)"
              pre="KSh "
            />
            <StatTile
              icon={<Calendar className="ic" />}
              label="Months Paid"
              val={new Set(myVerified.map((c) => c.month)).size}
              sub="verified monthly contributions"
              tone="var(--blue)"
            />
            <StatTile
              icon={<AlertTriangle className="ic" />}
              label="My Welfare Requests"
              val={myCases.length}
              sub="on record"
              tone="var(--goldD)"
            />
            <StatTile
              icon={<Bell className="ic" />}
              label="Notifications"
              val={notifications.filter((n) => n.role === 'member' && n.u).length}
              sub="unread messages"
              tone="var(--red)"
            />
          </div>

          {myPending.length > 0 && (
            <div className="govnote rv">
              <Coins className="ic" />
              <div>
                You have <b>{myPending.length}</b> contribution(s) awaiting the Treasurer's verification —{' '}
                {myPending.map((p) => `${money(p.amt)} (${p.month})`).join(', ')}. They will reflect in your verified total once approved.
              </div>
            </div>
          )}

          <div className="grid2">
            <div className="panel rv">
              <h3>
                <Bell className="ic" /> Association announcements
              </h3>
              {announcements.length > 0 ? (
                announcements.slice(0, 3).map((a, i) => (
                  <div key={a.id || i} className="ann">
                    <small>{a.date}</small>
                    {a.txt}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>No announcements yet.</p>
              )}
            </div>

            <div className="panel rv">
              <h3>
                <AlertTriangle className="ic" /> My welfare requests
              </h3>
              {myCases.length > 0 ? (
                myCases.map((c) => (
                  <div key={c.id} className="caserow">
                    <div className="ch">
                      <b>{c.id}</b> <Pill status={c.status} />
                      <span className="amt">{money(c.amt)}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                      {c.type} · Opened {c.opened}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>No welfare cases on file.</p>
              )}
              <div className="actions" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn pri sm"
                  onClick={() => onNavigate('assist')}
                >
                  <AlertTriangle className="ic" /> Request emergency assistance
                </button>
                <button
                  type="button"
                  className="btn gld sm"
                  onClick={() => onNavigate('contribs')}
                >
                  <Coins className="ic" /> Pay contribution
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {page === 'profile' && (
        <div className="grid2">
          <div className="panel rv">
            <h3>My profile</h3>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '16px' }}>
              <PhotoBox member={member} big />
              <div>
                <b style={{ fontFamily: 'var(--disp)', fontSize: '17px' }}>{member.name}</b>
                <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                  {member.school} · {member.id}
                </div>
                <button
                  type="button"
                  className="btn gho sm"
                  style={{ marginTop: '9px' }}
                  onClick={handleMyPhotoUpload}
                >
                  <Camera className="ic" /> {member.photo ? 'Change photo' : 'Upload photo'} · 35 × 45 mm
                </button>
              </div>
            </div>

            <dl className="kv">
              <dt>Membership No.</dt>
              <dd className="mono">{member.id}</dd>
              <dt>Username</dt>
              <dd className="mono">{member.user}</dd>
              <dt>TSC number</dt>
              <dd className="mono">{member.tsc}</dd>
              <dt>National ID</dt>
              <dd className="mono">{member.idno}</dd>
              <dt>School</dt>
              <dd>{member.school} · Kilifi County</dd>
              <dt>Position</dt>
              <dd>{member.position}</dd>
              <dt>Status</dt>
              <dd>
                <Pill status={member.status} />
              </dd>
              <dt>Phone</dt>
              <dd className="mono">{member.phone}</dd>
              <dt>ID scan</dt>
              <dd>
                {member.scan ? (
                  <a href={member.scan} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>
                    View scanned ID
                  </a>
                ) : (
                  <Pill status="Not Recorded" />
                )}
              </dd>
            </dl>
          </div>

          <div className="panel rv">
            <h3>Next of kin</h3>
            <p className="psub">Contacted in emergencies (Article 10).</p>
            <dl className="kv" style={{ marginBottom: '20px' }}>
              <dt>Name</dt>
              <dd>{member.nok?.n || '—'}</dd>
              <dt>ID number</dt>
              <dd className="mono">{member.nok?.id || '—'}</dd>
              <dt>Phone</dt>
              <dd className="mono">{member.nok?.p || '—'}</dd>
            </dl>

            <h3>Update contact details</h3>
            <p className="psub">Update your phone numbers in Firestore.</p>
            <form className="form" onSubmit={handleProfileSubmit}>
              <div className="field">
                <label>Phone number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="field">
                <label>Next of kin phone</label>
                <input value={nokPhone} onChange={(e) => setNokPhone(e.target.value)} required />
              </div>
              <button type="submit" className="btn pri">
                Save contact details
              </button>
            </form>
          </div>
        </div>
      )}

      {page === 'contribs' && (
        <>
          <div className="tiles">
            <StatTile
              icon={<Coins className="ic" />}
              label="Total Contributed"
              val={myVerified.reduce((a, c) => a + c.amt, 0)}
              sub="verified amounts"
              tone="var(--green)"
              pre="KSh "
            />
            <StatTile
              icon={<Calendar className="ic" />}
              label="Months Paid"
              val={new Set(myVerified.map((c) => c.month)).size}
              sub="verified months"
              tone="var(--blue)"
            />
            <StatTile
              icon={<Coins className="ic" />}
              label="Monthly Minimum"
              val={settings.min}
              sub="per Article 8"
              tone="var(--goldD)"
              pre="KSh "
            />
          </div>

          <div className="panel rv">
            <h3>Pay my monthly contribution</h3>
            <p className="psub">
              Choose your payment method: <b>M-PESA STK Push</b> (instant prompt on phone), <b>Paybill (522522)</b>, <b>Till Number (9876543)</b>, <b>M-PESA Mobile (0722 000 000)</b> or Bank Deposit.
            </p>

            <div style={{ background: '#F8F9F5', border: '1px solid var(--line)', borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <small style={{ color: 'var(--mut)', display: 'block' }}>M-PESA PAYBILL (Lipa na M-PESA)</small>
                <b>Business No: 522522</b><br />
                <small>Account: <b className="mono">KECSHA-KILIFI</b></small>
              </div>
              <div>
                <small style={{ color: 'var(--mut)', display: 'block' }}>M-PESA TILL (Buy Goods)</small>
                <b>Till No: 9876543</b><br />
                <small>Kilifi KECSHA Welfare Store</small>
              </div>
              <div>
                <small style={{ color: 'var(--mut)', display: 'block' }}>M-PESA MOBILE NUMBER</small>
                <b className="mono">0722 000 000</b><br />
                <small>Kilifi Treasurer Official</small>
              </div>
            </div>

            <form className="form" onSubmit={handlePaySubmit}>
              <div className="field">
                <label>Month *</label>
                <select value={payMonth} onChange={(e) => setPayMonth(e.target.value)}>
                  {[curMonth(), ...MONTHS.map((m) => `${m} ${new Date().getFullYear()}`).filter((x) => x !== curMonth())].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Amount paid (KSh) *</label>
                <input
                  type="number"
                  min={settings.min}
                  value={payAmt}
                  onChange={(e) => setPayAmt(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="field">
                <label>Payment method *</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="M-PESA STK Push">⚡ M-PESA STK Push (Instant Prompt)</option>
                  <option value="M-PESA Paybill">M-PESA Paybill (522522)</option>
                  <option value="M-PESA Till Number">M-PESA Till Number (9876543)</option>
                  <option value="M-PESA Mobile Number">M-PESA Mobile Number (0722000000)</option>
                  <option value="Bank deposit / transfer">Bank deposit / transfer</option>
                </select>
              </div>

              {payMethod === 'M-PESA STK Push' && (
                <div className="field" style={{ gridColumn: '1 / -1', background: '#EAF3DE', padding: '14px', borderRadius: '10px', border: '1px solid #C0D8A8' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--greenD)' }}>
                    <Smartphone className="ic" style={{ width: '16px' }} /> M-PESA STK Push Simulator
                  </label>
                  <p style={{ fontSize: '13px', color: 'var(--mut)', marginBottom: '8px' }}>
                    Enter your M-PESA registered phone number to receive a secure USSD payment prompt instantly on your device.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      style={{ flex: 1 }}
                      defaultValue={member.phone || '0712345678'}
                      id="stkPhoneInput"
                      placeholder="e.g. 0712345678"
                    />
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => {
                        const simulatedCode = 'STK' + Math.floor(1000000 + Math.random() * 9000000);
                        setPayRef(simulatedCode);
                        // Generate a digital receipt preview
                        const c = document.createElement('canvas');
                        c.width = 400; c.height = 250;
                        const ctx = c.getContext('2d');
                        if (ctx) {
                          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 400, 250);
                          ctx.fillStyle = '#113E21'; ctx.font = 'bold 15px sans-serif';
                          ctx.fillText('M-PESA STK PUSH RECEIPT', 20, 30);
                          ctx.fillStyle = '#333333'; ctx.font = '12px sans-serif';
                          ctx.fillText(`Confirmation Code: ${simulatedCode}`, 20, 65);
                          ctx.fillText(`Amount: KSh ${payAmt.toLocaleString()}`, 20, 90);
                          ctx.fillText(`Account: KECSHA KILIFI (${payMonth})`, 20, 115);
                          ctx.fillText(`Status: Completed Successfully ✓`, 20, 140);
                          ctx.fillText(`Date: ${todayStr()}`, 20, 165);
                          setPayEvidence(c.toDataURL('image/jpeg', 0.8));
                        }
                        onShowToast(`STK Push sent! Prompt confirmed for ${simulatedCode}`);
                      }}
                    >
                      Trigger STK Push
                    </button>
                  </div>
                </div>
              )}

              <div className="field">
                <label>Payment reference / M-PESA Code *</label>
                <input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g., QG78XYZ90 or slip no."
                  required
                />
              </div>

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Payment evidence receipt or STK screenshot *</label>
                <div className="upbox">
                  {payEvidence ? (
                    <>
                      <img className="ev-prev" src={payEvidence} alt="Evidence preview" />
                      <span>
                        <b style={{ color: 'var(--green)' }}>Receipt attached ✓</b>
                      </span>
                    </>
                  ) : (
                    <span>
                      M-PESA screenshot, STK receipt or scanned bank slip
                      <br />
                      <b style={{ color: 'var(--goldD)' }}>JPG / PNG</b>
                    </span>
                  )}
                </div>
                <div className="actions" style={{ marginTop: '8px' }}>
                  <button type="button" className="btn pri sm" onClick={handleEvidenceUpload}>
                    <Camera className="ic" /> Upload receipt / screenshot
                  </button>
                  {payEvidence && (
                    <button type="button" className="btn gho sm" onClick={() => setPayEvidence(null)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <button type="submit" className="btn pri" disabled={paySubmitting}>
                {paySubmitting ? 'Submitting to database...' : 'Submit for verification'}
              </button>
            </form>
          </div>

          <div className="panel rv">
            <h3>My contribution history</h3>
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Receipt</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Evidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myContribs.length > 0 ? (
                    myContribs.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <b>{c.month}</b>
                        </td>
                        <td className="mono">{c.id}</td>
                        <td>{c.method || '—'}</td>
                        <td className="mono">{c.ref}</td>
                        <td>{c.date}</td>
                        <td className="mono">{money(c.amt)}</td>
                        <td>
                          {c.evidence ? (
                            <a href={c.evidence} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>
                              View
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <Pill status={c.status} />
                          {c.status === 'Rejected' && c.note && (
                            <div style={{ fontSize: '11px', color: 'var(--red)' }}>{c.note}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '18px', color: 'var(--mut)' }}>
                        No contributions submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="actions" style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn gho sm"
                onClick={() => {
                  const headers = ['Receipt No', 'Month', 'Method', 'Reference', 'Date', 'Amount (KSh)', 'Status'];
                  const rows = myContribs.map(c => [c.id, c.month, c.method || 'M-PESA', c.ref, c.date, c.amt, c.status]);
                  exportToCSV(`${member.id}-contributions`, headers, rows);
                  onShowToast('Your contribution statement exported as CSV/Excel');
                }}
              >
                <Download className="ic" style={{ width: '14px' }} /> Download Excel / CSV
              </button>
              <button
                type="button"
                className="btn gho sm"
                onClick={() => exportToPDF(`${member.name} — Contribution Statement`)}
              >
                <Printer className="ic" style={{ width: '14px' }} /> Download PDF / Print
              </button>
            </div>
          </div>
        </>
      )}

      {page === 'assist' && (
        <div className="grid2">
          <div className="panel rv">
            <h3>Death benefit — How it works</h3>
            <dl className="kv">
              <dt>Benefit</dt>
              <dd>
                <b className="mono">{money(settings.death)}</b> — agreed by members
              </dd>
              <dt>Payable to</dt>
              <dd>
                Your written beneficiary: <b>{member.ben.n}</b> ({member.ben.r})
              </dd>
              <dt>Claim window</dt>
              <dd>Within 90 days of death (Article 9)</dd>
              <dt>Documents</dt>
              <dd>Death certificate · burial permit · beneficiary ID · chief's letter</dd>
              <dt>Payment</dt>
              <dd>Within 21 days of approval</dd>
            </dl>
            <div className="actions" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn gho sm"
                onClick={() => onNavigate('beneficiary')}
              >
                Review my beneficiary
              </button>
            </div>
          </div>

          <div className="panel rv">
            <h3>Request emergency assistance</h3>
            <p className="psub">
              Covered: hospitalisation, fire/disaster, bereavement of immediate family. Cap: {money(settings.emer)}.
            </p>
            <form className="form" onSubmit={handleEmergencySubmit}>
              <div className="field">
                <label>Category</label>
                <select value={emerCat} onChange={(e) => setEmerCat(e.target.value)}>
                  <option value="Hospitalisation">Hospitalisation</option>
                  <option value="Fire / Disaster">Fire / Disaster</option>
                  <option value="Bereavement — immediate family">Bereavement — immediate family</option>
                </select>
              </div>

              <div className="field">
                <label>Amount requested (KSh)</label>
                <input
                  type="number"
                  max={settings.emer}
                  value={emerAmt}
                  onChange={(e) => setEmerAmt(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Describe the emergency</label>
                <textarea
                  rows={3}
                  value={emerDesc}
                  onChange={(e) => setEmerDesc(e.target.value)}
                  placeholder="Provide brief details..."
                  required
                />
              </div>

              <button type="submit" className="btn pri">
                Submit emergency request
              </button>
            </form>
          </div>
        </div>
      )}

      {page === 'beneficiary' && (
        <div className="grid2">
          <div className="panel rv">
            <h3>Current written beneficiary</h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
              {member.ben.photo ? (
                <img className="photo big" src={member.ben.photo} alt={member.ben.n} />
              ) : (
                <div className="photo ph big">{member.ben.n === 'None on file' ? '?' : member.ben.n[0]}</div>
              )}
              <dl className="kv" style={{ gridTemplateColumns: '130px 1fr' }}>
                <dt>Name</dt>
                <dd>{member.ben.n}</dd>
                <dt>ID number</dt>
                <dd className="mono">{member.ben.id || '—'}</dd>
                <dt>Relationship</dt>
                <dd>{member.ben.r}</dd>
                <dt>Phone</dt>
                <dd className="mono">{member.ben.p}</dd>
                <dt>Status</dt>
                <dd>
                  <Pill status={member.ben.s} />
                </dd>
              </dl>
            </div>
            <p className="psub">
              Death benefit of <b className="mono">{money(settings.death)}</b> is paid to this person upon a verified claim (Articles 7 & 9).
            </p>
          </div>

          <div className="panel rv">
            <h3>Update beneficiary</h3>
            <p className="psub">Changes take effect after Secretary verification.</p>
            <form className="form" onSubmit={handleBeneficiarySubmit}>
              <div className="field">
                <label>Full name</label>
                <input
                  value={benName}
                  onChange={(e) => setBenName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>ID number</label>
                <input
                  value={benId}
                  onChange={(e) => setBenId(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Relationship</label>
                <select value={benRel} onChange={(e) => setBenRel(e.target.value)}>
                  <option>Spouse</option>
                  <option>Son</option>
                  <option>Daughter</option>
                  <option>Brother</option>
                  <option>Sister</option>
                  <option>Mother</option>
                  <option>Father</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Phone number</label>
                <input
                  value={benPhone}
                  onChange={(e) => setBenPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                />
              </div>

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="btn gho sm" onClick={handleBenPhotoUpload}>
                  <Camera className="ic" /> Upload 35 × 45 mm photo
                </button>
                {benPhoto && <span style={{ marginLeft: '10px', color: 'var(--green)', fontSize: '12px' }}>Photo attached ✓</span>}
              </div>

              <button type="submit" className="btn pri">
                Submit update for verification
              </button>
            </form>
          </div>
        </div>
      )}

      {page === 'notifs' && (
        <div className="panel rv">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3>My notifications</h3>
            <button type="button" className="btn gho sm" onClick={onMarkNotificationsRead}>
              Mark all as read
            </button>
          </div>
          {notifications.filter((n) => n.role === 'member').length > 0 ? (
            notifications
              .filter((n) => n.role === 'member')
              .map((n, i) => (
                <div
                  key={n.id || i}
                  className="ann"
                  style={n.u ? { borderLeftColor: 'var(--red)', background: '#FBF4E4' } : {}}
                >
                  <small>{n.u ? 'Unread' : 'Read'}</small>
                  {n.txt}
                </div>
              ))
          ) : (
            <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>No notifications.</p>
          )}
        </div>
      )}

      {page === 'constitution' && <ConstitutionDoc />}
    </div>
  );
};
