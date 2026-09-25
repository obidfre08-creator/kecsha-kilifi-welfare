import React, { useState } from 'react';
import {
  Member,
  Contrib,
  Payout,
  WelfareCase,
  Meeting,
  Officer,
  WelfareSettings,
} from '../types';
import {
  StatTile,
  Pill,
  PhotoBox,
  initials,
  money,
  MONTHS,
  curMonth,
  exportToCSV,
  exportToPDF,
} from '../utils/helpers';
import { Users, AlertTriangle, Stamp, Calendar, Coins, BarChart2, Book, Check, X, Download, Printer, Trash2 } from 'lucide-react';
import { ConstitutionDoc } from './ConstitutionDoc';

interface ChairPortalProps {
  page: string;
  members: Member[];
  contribs: Contrib[];
  payouts: Payout[];
  cases: WelfareCase[];
  meetings: Meeting[];
  officers: Record<string, Officer>;
  settings: WelfareSettings;
  onApproveMember: (m: Member) => void;
  onDeclineMember: (m: Member, reason: string) => void;
  onDeleteMember?: (m: Member) => void;
  onApproveCase: (c: WelfareCase) => void;
  onRejectCase: (c: WelfareCase, reason: string) => void;
  onCountersignContrib: (c: Contrib) => void;
  onApproveMeetingAgenda: (m: Meeting) => void;
  onToggleOfficerStatus: (officerKey: string) => void;
  onSaveSettings: (settings: WelfareSettings) => Promise<void>;
  onNavigate: (page: string) => void;
  onShowToast: (msg: string, kind?: 'info' | 'err') => void;
}

export const ChairPortal: React.FC<ChairPortalProps> = ({
  page,
  members,
  contribs,
  payouts,
  cases,
  meetings,
  officers,
  settings,
  onApproveMember,
  onDeclineMember,
  onDeleteMember,
  onApproveCase,
  onRejectCase,
  onCountersignContrib,
  onApproveMeetingAgenda,
  onToggleOfficerStatus,
  onSaveSettings,
  onNavigate,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSettings, setLocalSettings] = useState(settings);

  const pendNonChair = members.filter(
    (m) => m.status === 'Pending Verification' && m.position !== 'Chairperson'
  );
  const openCases = cases.filter((c) => c.status !== 'Paid' && c.status !== 'Rejected');
  const pendApprovalCases = cases.filter((c) => c.status === 'Pending Approval');

  const verifiedContribs = contribs.filter((c) => c.status === 'Verified');
  const sumContribs = verifiedContribs.reduce((a, c) => a + c.amt, 0);
  const sumPayouts = payouts.reduce((a, p) => a + p.amt, 0);

  // Filtered members
  const filteredMembers = members.filter((m) => {
    if (m.status === 'Declined') return false;
    const q = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.school.toLowerCase().includes(q) ||
      m.tsc.toLowerCase().includes(q) ||
      m.idno.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  });

  const monthTotals = MONTHS.map((m) => {
    let tot = 0;
    verifiedContribs.forEach((c) => {
      if (c.month && c.month.startsWith(m)) tot += c.amt;
    });
    return { month: m, total: tot };
  });
  const maxMonth = Math.max(...monthTotals.map((x) => x.total), 1);

  return (
    <div>
      {page === 'dash' && (
        <>
          <div className="tiles">
            <StatTile
              icon={<Users className="ic" />}
              label="Total Members"
              val={members.filter((m) => m.status === 'Active').length}
              sub={`${pendNonChair.length} pending your approval`}
              tone="var(--green)"
            />
            <StatTile
              icon={<AlertTriangle className="ic" />}
              label="Open Welfare Cases"
              val={openCases.length}
              sub="in documentation or review"
              tone="var(--red)"
            />
            <StatTile
              icon={<Stamp className="ic" />}
              label="Pending Approvals"
              val={pendApprovalCases.length}
              sub="awaiting your decision"
              tone="var(--goldD)"
            />
            <StatTile
              icon={<Calendar className="ic" />}
              label="Upcoming Meetings"
              val={meetings.length}
              sub="scheduled association sessions"
              tone="var(--blue)"
            />
          </div>

          <div className="panel rv">
            <h3>
              <Stamp className="ic" /> Registrations awaiting your approval
            </h3>
            <p className="psub">
              Approve members, Secretary and Treasurer here. (The Chairperson is approved by the Administrator.)
            </p>
            {pendNonChair.length > 0 ? (
              pendNonChair.map((m) => (
                <div key={m.id} className="offc" style={{ alignItems: 'flex-start' }}>
                  <div className="oav">
                    {m.photo ? <img src={m.photo} alt={m.name} /> : initials(m.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <b>{m.name}</b> <span className="pill p-b">{m.position}</span> <Pill status={m.status} />
                    <small>{m.school} · {m.id}</small>
                    <small>TSC: {m.tsc} · ID: {m.idno} · {m.phone}</small>
                    <small>Login: <b className="mono">{m.user}</b></small>
                    <small>
                      Beneficiary: <b>{m.ben.n}</b> ({m.ben.r}) · ID: {m.ben.id}
                    </small>
                    <small>
                      Scanned ID: {m.scan ? <a href={m.scan} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>view scan ✓</a> : 'missing ✗'}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => onApproveMember(m)}
                    >
                      Approve & activate
                    </button>
                    <button
                      type="button"
                      className="btn dng sm"
                      onClick={() => {
                        const r = prompt('Reason for declining:');
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
                No registrations awaiting your approval.
              </p>
            )}
          </div>

          <div className="grid2">
            <div className="panel rv">
              <h3>
                <AlertTriangle className="ic" /> Welfare cases awaiting approval
              </h3>
              {pendApprovalCases.length > 0 ? (
                pendApprovalCases.map((c) => (
                  <div key={c.id} className="caserow">
                    <div className="ch">
                      <b>{c.id}</b> <span className="pill p-b">{c.type}</span>
                      <span className="amt">{money(c.amt)}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                      {c.member} → {c.ben}
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn pri sm"
                        onClick={() => onApproveCase(c)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn gho sm"
                        onClick={() => onNavigate('approvals')}
                      >
                        Open review desk
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                  The approval queue is clear.
                </p>
              )}
            </div>

            <div className="panel rv">
              <h3>
                <Calendar className="ic" /> Meetings & resolutions
              </h3>
              {meetings.length > 0 ? (
                meetings.slice(0, 2).map((m) => (
                  <div key={m.id} className="caserow">
                    <div className="ch">
                      <b>{m.title}</b> <Pill status={m.agendaStatus} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                      {m.date} · {m.venue}
                    </div>
                    <div className="actions">
                      {m.agendaStatus !== 'Approved' && (
                        <button
                          type="button"
                          className="btn gld sm"
                          onClick={() => onApproveMeetingAgenda(m)}
                        >
                          Approve agenda
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn gho sm"
                        onClick={() => onNavigate('meetings')}
                      >
                        Meetings desk
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                  No meetings scheduled yet.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {page === 'members' && (
        <div className="panel rv">
          <h3>
            <Users className="ic" /> Membership roll
          </h3>
          <p className="psub">
            Complete register of head teachers in Kilifi County with verified photos, TSC and ID numbers.
          </p>
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
                  <th>TSC No.</th>
                  <th>ID No.</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Months</th>
                  <th>Total Paid</th>
                  <th>Written Beneficiary</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <PhotoBox member={m} />
                      </td>
                      <td className="mono">{m.id}</td>
                      <td>
                        <b>{m.name}</b>
                        {m.role !== '—' && <span className="pill p-b ml-1">{m.role}</span>}
                      </td>
                      <td>{m.school}</td>
                      <td className="mono">{m.tsc}</td>
                      <td className="mono">{m.idno}</td>
                      <td className="mono">{m.phone}</td>
                      <td>
                        <Pill status={m.status} />
                      </td>
                      <td className="mono">{m.months}</td>
                      <td className="mono">{money(m.total)}</td>
                      <td>
                        {m.ben.n === 'None on file' ? (
                          <span style={{ color: 'var(--red)' }}>None on file</span>
                        ) : (
                          <>
                            {m.ben.n} <small style={{ color: 'var(--mut)' }}>({m.ben.r})</small>{' '}
                            <Pill status={m.ben.s} />
                          </>
                        )}
                      </td>
                      <td>
                        {m.position !== 'Chairperson' && onDeleteMember && (
                          <button
                            type="button"
                            className="btn dng sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete member ${m.name} (${m.id})?`)) {
                                onDeleteMember(m);
                              }
                            }}
                          >
                            <Trash2 className="ic" style={{ width: '13px' }} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '18px', color: 'var(--mut)' }}>
                      No member records found.
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
                const headers = ['No', 'Name', 'School', 'TSC No', 'ID No', 'Phone', 'Status', 'Months', 'Total Paid', 'Beneficiary'];
                const rows = filteredMembers.map(m => [m.id, m.name, m.school, m.tsc, m.idno, m.phone, m.status, m.months, m.total, m.ben.n]);
                exportToCSV('kilifi-kecsha-members', headers, rows);
                onShowToast('Membership roll exported as CSV/Excel');
              }}
            >
              <Download className="ic" style={{ width: '14px' }} /> Download Excel / CSV
            </button>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => exportToPDF('Kilifi County KECSHA Membership Roll')}
            >
              <Printer className="ic" style={{ width: '14px' }} /> Download PDF / Print
            </button>
          </div>
        </div>
      )}

      {page === 'officers' && (
        <div className="panel rv">
          <h3>Manage Secretary & Treasurer</h3>
          <p className="psub">
            You approve and activate these offices from their member registrations.
          </p>
          {(['secretary', 'treasurer'] as const).map((k) => {
            const o = officers[k] || { name: 'Vacant', status: 'Vacant' };
            const title = k === 'secretary' ? 'Secretary' : 'Treasurer';
            const mm = members.find((x) => x.role === title);

            return (
              <div key={k} className="offc">
                <div className="oav">
                  {mm && mm.photo ? <img src={mm.photo} alt={o.name} /> : initials(o.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <b>{o.name}</b>
                  {mm ? (
                    <small>
                      TSC {mm.tsc} · ID {mm.idno} · {mm.school}
                    </small>
                  ) : (
                    <small>Office vacant — awaiting registration & approval</small>
                  )}
                  <small>
                    {k === 'secretary'
                      ? 'Member records · cases · meetings · communication'
                      : 'Contributions · payments · statements · reconciliation'}
                  </small>
                </div>
                <Pill status={o.status} />
                {o.status === 'Active' && (
                  <button
                    type="button"
                    className="btn gho sm"
                    onClick={() => onToggleOfficerStatus(k)}
                  >
                    Place on leave
                  </button>
                )}
                {o.status === 'On Leave' && (
                  <button
                    type="button"
                    className="btn gho sm"
                    onClick={() => onToggleOfficerStatus(k)}
                  >
                    Restore to duty
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {page === 'approvals' && (
        <div className="panel rv">
          <h3>Review & Approvals Desk</h3>
          <p className="psub">
            Approval procedure (Article 18): Secretary documents → Treasurer verifies → Chairperson approves → Treasurer disburses.
          </p>
          {pendApprovalCases.length > 0 ? (
            pendApprovalCases.map((c) => (
              <div key={c.id} className="caserow rv">
                <div className="ch">
                  <b>{c.id}</b> <span className="pill p-b">{c.type}</span>
                  <Pill status={c.status} />
                  <span className="amt">{money(c.amt)}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                  Member: <b style={{ color: 'var(--ink)' }}>{c.member}</b> · Beneficiary: {c.ben} · Opened: {c.opened}
                </div>
                <div>
                  {Object.keys(c.docs || {}).map((k) => (
                    <span
                      key={k}
                      className={`docchip ${c.docs[k] ? 'ok' : ''}`}
                    >
                      {c.docs[k] ? '✓' : '○'} {k}
                    </span>
                  ))}
                </div>
                {c.note && <p style={{ fontSize: '12.8px', marginTop: '8px' }}>{c.note}</p>}
                <div className="actions">
                  <button
                    type="button"
                    className="btn pri sm"
                    onClick={() => onApproveCase(c)}
                  >
                    <Stamp className="ic" /> Approve benefit
                  </button>
                  <button
                    type="button"
                    className="btn dng sm"
                    onClick={() => {
                      const r = prompt('Reason for rejection:');
                      if (r) onRejectCase(c, r);
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
              No welfare requests currently awaiting approval.
            </p>
          )}
        </div>
      )}

      {page === 'cases' && (
        <div className="panel rv">
          <h3>All Welfare Cases</h3>
          <p className="psub">Overview of all active, approved, and historical cases.</p>
          {cases.length > 0 ? (
            cases.map((c) => (
              <div key={c.id} className="caserow rv">
                <div className="ch">
                  <b>{c.id}</b> <span className="pill p-b">{c.type}</span>
                  <Pill status={c.status} />
                  <span className="amt">{money(c.amt)}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                  Member: {c.member} · Beneficiary: {c.ben} · Opened {c.opened}
                </div>
                {c.note && <p style={{ fontSize: '12.8px', marginTop: '6px' }}>{c.note}</p>}
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>No cases on file yet.</p>
          )}
        </div>
      )}

      {page === 'finance' && (
        <>
          <div className="locknote rv">
            <Coins className="ic" />
            <div>
              <b>Read-only financial oversight.</b> You review fund status and monitor authorized payments. Countersign the Treasurer's own contributions under Article 16.
            </div>
          </div>

          <div className="panel rv" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#F8F9F5' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>Executive Financial Reports (Contribs & Payouts)</h3>
              <p className="psub" style={{ margin: 0 }}>
                Download comprehensive financial statements fetched live from database states (`contribs` & `payouts`).
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn pri sm"
                onClick={() => {
                  const headers = ['Record Type', 'ID / Ref', 'Member / Payee', 'Month / Date', 'Method', 'Amount (KSh)', 'Status'];
                  const rows = [
                    ...contribs.map(c => ['Contribution', c.id, c.m, c.month, c.method || 'M-PESA', c.amt, c.status]),
                    ...payouts.map(p => ['Payout', p.id, p.to, p.date, 'Welfare Disbursement', p.amt, 'Paid'])
                  ];
                  exportToCSV('chairperson-financial-report-contribs-payouts', headers, rows);
                }}
              >
                <Download className="ic" style={{ width: '14px' }} /> Download Excel / CSV
              </button>
              <button
                type="button"
                className="btn gho sm"
                onClick={() => exportToPDF('Chairperson Executive Financial Oversight Report (Contribs & Payouts)')}
              >
                <Printer className="ic" style={{ width: '14px' }} /> Download PDF / Print
              </button>
            </div>
          </div>

          <div className="tiles">
            <StatTile
              icon={<Coins className="ic" />}
              label="Association Fund"
              val={sumContribs - sumPayouts}
              sub="verified contributions minus payments"
              tone="var(--green)"
              pre="KSh "
            />
            <StatTile
              icon={<BarChart2 className="ic" />}
              label="Contributions Verified"
              val={sumContribs}
              sub="verified by Treasurer"
              tone="var(--goldD)"
              pre="KSh "
            />
            <StatTile
              icon={<Coins className="ic" />}
              label="Benefits Paid"
              val={sumPayouts}
              sub="total disbursements"
              tone="var(--red)"
              pre="KSh "
            />
            <StatTile
              icon={<AlertTriangle className="ic" />}
              label="Awaiting Verification"
              val={contribs.filter((c) => c.status === 'Pending Verification').length}
              sub="proofs submitted by members"
              tone="var(--blue)"
            />
          </div>

          <div className="panel rv">
            <h3>Countersignature desk (Article 16)</h3>
            <p className="psub">
              The Treasurer cannot verify their own contribution. You review and countersign it here.
            </p>
            {contribs.filter((c) => c.status === 'Pending Verification').length > 0 ? (
              contribs
                .filter((c) => c.status === 'Pending Verification')
                .map((c) => (
                  <div key={c.id} className="caserow">
                    <div className="ch">
                      <b>{c.m}</b> <span className="pill p-b">{c.month}</span>
                      <Pill status={c.status} />
                      <span className="amt">{money(c.amt)}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                      Ref: <b className="mono">{c.ref}</b> · Submitted: {c.date} ·{' '}
                      {c.evidence ? (
                        <a href={c.evidence} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>
                          View evidence receipt
                        </a>
                      ) : (
                        'No evidence'
                      )}
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn pri sm"
                        onClick={() => onCountersignContrib(c)}
                      >
                        <Stamp className="ic" /> Countersign & verify
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                No contribution evidence awaiting countersignature.
              </p>
            )}
          </div>

          <div className="panel rv">
            <h3>Monthly contributions (verified)</h3>
            <div className="chart">
              {monthTotals.map((x) => (
                <div key={x.month} className="bar" title={money(x.total)}>
                  <i
                    style={{
                      height: `${Math.max((x.total / maxMonth) * 100, x.total ? 6 : 2)}%`,
                    }}
                  />
                  <em>{x.month}</em>
                  <u>{x.total ? (x.total / 1000).toFixed(1) + 'k' : '·'}</u>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {page === 'meetings' && (
        <div className="panel rv">
          <h3>Meetings & resolutions</h3>
          {meetings.map((m) => (
            <div key={m.id} className="caserow">
              <div className="ch">
                <b>{m.title}</b> <Pill status={m.agendaStatus} />
                <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: 'var(--mut)' }}>
                  {m.date}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                {m.venue} {m.att && `· ${m.att}`}
              </div>
              <div style={{ marginTop: '8px', fontSize: '13.5px' }}>
                <b style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)' }}>
                  Agenda
                </b>
                <ol style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  {m.agenda.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ol>
              </div>
              <div className="actions">
                {m.agendaStatus === 'Draft' && (
                  <button
                    type="button"
                    className="btn gld sm"
                    onClick={() => onApproveMeetingAgenda(m)}
                  >
                    Approve agenda
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {page === 'reports' && (
        <div className="grid3">
          <div className="panel rv">
            <h3>Membership Report</h3>
            <p className="psub">Full member roll with photos, compliance, and beneficiaries.</p>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => {
                const csv = 'ID,Name,School,Phone,TSC,IDNo,Status\n' +
                  members.map((m) => `"${m.id}","${m.name}","${m.school}","${m.phone}","${m.tsc}","${m.idno}","${m.status}"`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `members-report-${Date.now()}.csv`;
                a.click();
                onShowToast('Membership report exported');
              }}
            >
              Export CSV
            </button>
          </div>

          <div className="panel rv">
            <h3>Welfare Cases Report</h3>
            <p className="psub">Open, pending, approved and paid welfare cases.</p>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => {
                const csv = 'ID,Type,Member,Beneficiary,Amount,Status,Opened\n' +
                  cases.map((c) => `"${c.id}","${c.type}","${c.member}","${c.ben}",${c.amt},"${c.status}","${c.opened}"`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cases-report-${Date.now()}.csv`;
                a.click();
                onShowToast('Welfare cases report exported');
              }}
            >
              Export CSV
            </button>
          </div>

          <div className="panel rv">
            <h3>Financial Report</h3>
            <p className="psub">Summary of verified member contributions and disbursements.</p>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => {
                const csv = 'Fund Balance,Verified Income,Disbursements\n' +
                  `${sumContribs - sumPayouts},${sumContribs},${sumPayouts}\n`;
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `finance-summary-${Date.now()}.csv`;
                a.click();
                onShowToast('Financial report exported');
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      )}

      {page === 'rules' && (
        <>
          <div className="panel rv">
            <h3>Welfare parameters</h3>
            <p className="psub">
              Changes reflect Schedule 1 of the Constitution and sync across all devices in real-time.
            </p>
            <form
              className="form"
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveSettings(localSettings);
                onShowToast('Welfare parameters updated in Firestore');
              }}
            >
              <div className="field">
                <label>Minimum contribution (KSh)</label>
                <input
                  type="number"
                  value={localSettings.min}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, min: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Death benefit (KSh)</label>
                <input
                  type="number"
                  value={localSettings.death}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, death: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Emergency cap (KSh)</label>
                <input
                  type="number"
                  value={localSettings.emer}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, emer: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <button type="submit" className="btn pri">
                Save parameters
              </button>
            </form>
          </div>

          <ConstitutionDoc />
        </>
      )}
    </div>
  );
};
