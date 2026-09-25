import React, { useState } from 'react';
import {
  Member,
  Contrib,
  Payout,
  WelfareCase,
  AuditEntry,
  WelfareSettings,
} from '../types';
import {
  StatTile,
  Pill,
  money,
  MONTHS,
  curMonth,
  todayStr,
  exportToCSV,
  exportToPDF,
} from '../utils/helpers';
import { Coins, BarChart2, AlertTriangle, Book, Stamp, FileText, Check, X, Download, Printer } from 'lucide-react';

interface TreasurerPortalProps {
  page: string;
  members: Member[];
  contribs: Contrib[];
  payouts: Payout[];
  cases: WelfareCase[];
  auditLog: AuditEntry[];
  settings: WelfareSettings;
  onVerifyContrib: (c: Contrib) => Promise<void>;
  onRejectContrib: (c: Contrib, reason: string) => Promise<void>;
  onRecordOfficeContrib: (contrib: Contrib) => Promise<void>;
  onDisburseCase: (caseItem: WelfareCase, ref: string) => Promise<void>;
  onToggleReconciliation: (c: Contrib) => Promise<void>;
  onShowToast: (msg: string, kind?: 'info' | 'err') => void;
}

export const TreasurerPortal: React.FC<TreasurerPortalProps> = ({
  page,
  members,
  contribs,
  payouts,
  cases,
  auditLog,
  settings,
  onVerifyContrib,
  onRejectContrib,
  onRecordOfficeContrib,
  onDisburseCase,
  onToggleReconciliation,
  onShowToast,
}) => {
  // Direct recording form
  const [recMember, setRecMember] = useState(members[0]?.id || '');
  const [recMonth, setRecMonth] = useState(curMonth());
  const [recAmt, setRecAmt] = useState(settings.min);
  const [recRef, setRecRef] = useState('');

  const verified = contribs.filter((c) => c.status === 'Verified');
  const pendingEvidence = contribs.filter((c) => c.status === 'Pending Verification');
  const sumVerified = verified.reduce((a, c) => a + c.amt, 0);
  const sumPayouts = payouts.reduce((a, p) => a + p.amt, 0);

  const readyForPayment = cases.filter((c) => c.status === 'Approved for Payment');

  const monthTotals = MONTHS.map((m) => {
    let tot = 0;
    verified.forEach((c) => {
      if (c.month && c.month.startsWith(m)) tot += c.amt;
    });
    return { month: m, total: tot };
  });
  const maxMonth = Math.max(...monthTotals.map((x) => x.total), 1);

  const handleRecordContrib = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recAmt < settings.min) {
      onShowToast(`Amount is below constitutional minimum of ${money(settings.min)}`, 'err');
      return;
    }
    if (!recRef) {
      onShowToast('Enter payment reference', 'err');
      return;
    }

    const nextId = `CT-${String(1000 + contribs.length + 1)}`;
    const newC: Contrib = {
      id: nextId,
      m: recMember,
      month: recMonth,
      amt: recAmt,
      ref: recRef.trim().toUpperCase(),
      method: 'Office Direct Entry',
      date: todayStr(),
      status: 'Verified',
      v: true,
      evidence: null,
      by: 'Treasurer',
    };

    await onRecordOfficeContrib(newC);
    setRecRef('');
    onShowToast(`Contribution of ${money(recAmt)} recorded for member ${recMember}`);
  };

  const handleDisbursementClick = async (caseItem: WelfareCase) => {
    const ref = prompt(`Enter disbursement transaction reference (e.g., M-PESA confirmation code or Cheque no.) for ${caseItem.id}:`);
    if (!ref || !ref.trim()) return;
    await onDisburseCase(caseItem, ref.trim().toUpperCase());
    onShowToast(`Disbursement of ${money(caseItem.amt)} recorded for case ${caseItem.id}`);
  };

  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.name} (${m.id})` : id;
  };

  return (
    <div>
      {page === 'dash' && (
        <>
          <div className="tiles">
            <StatTile
              icon={<Coins className="ic" />}
              label="Verified Contributions"
              val={sumVerified}
              sub={`minimum ${money(settings.min)}/mo`}
              tone="var(--green)"
              pre="KSh "
            />
            <StatTile
              icon={<BarChart2 className="ic" />}
              label="Contributors This Month"
              val={new Set(verified.filter((c) => c.month === curMonth()).map((c) => c.m)).size}
              sub={`of ${members.filter((m) => m.status === 'Active').length} active (${curMonth()})`}
              tone="var(--blue)"
            />
            <StatTile
              icon={<Coins className="ic" />}
              label="Evidence Awaiting Check"
              val={pendingEvidence.length}
              sub="member payment proofs"
              tone="var(--goldD)"
            />
            <StatTile
              icon={<AlertTriangle className="ic" />}
              label="Approved For Payment"
              val={readyForPayment.reduce((a, c) => a + c.amt, 0)}
              sub={`${readyForPayment.length} authorized by Chairperson`}
              tone="var(--red)"
              pre="KSh "
            />
          </div>

          <div className="panel rv">
            <h3>
              <Coins className="ic" /> Member payment proofs awaiting verification
            </h3>
            <p className="psub">
              Review member-submitted M-PESA screenshots or bank slips. Verifying updates member totals and financial ledgers across all devices in real-time.
            </p>
            {pendingEvidence.length > 0 ? (
              pendingEvidence.map((c) => (
                <div key={c.id} className="caserow">
                  <div className="ch">
                    <b>{memberName(c.m)}</b> <span className="pill p-b">{c.month}</span>
                    <Pill status={c.status} />
                    <span className="amt">{money(c.amt)}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                    Method: <b>{c.method}</b> · Ref: <b className="mono">{c.ref}</b> · Submitted: {c.date} ·{' '}
                    {c.evidence ? (
                      <a href={c.evidence} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>
                        View evidence receipt ✓
                      </a>
                    ) : (
                      'No evidence attached'
                    )}
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => onVerifyContrib(c)}
                    >
                      <Stamp className="ic" /> Verify & approve
                    </button>
                    <button
                      type="button"
                      className="btn dng sm"
                      onClick={() => {
                        const r = prompt('Reason for rejecting this proof:');
                        if (r) onRejectContrib(c, r);
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
                No contribution evidence awaiting verification. The desk is clear.
              </p>
            )}
          </div>

          <div className="panel rv">
            <h3>Contributions curve (verified)</h3>
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

      {page === 'contribs' && (
        <>
          <div className="panel rv">
            <h3>Record a contribution (Direct office receipt)</h3>
            <p className="psub">
              Use when cash or bank transfer is received directly by the Treasury. Enforces minimum of {money(settings.min)}.
            </p>
            <form className="form" onSubmit={handleRecordContrib}>
              <div className="field">
                <label>Member</label>
                <select value={recMember} onChange={(e) => setRecMember(e.target.value)}>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Month</label>
                <select value={recMonth} onChange={(e) => setRecMonth(e.target.value)}>
                  {[curMonth(), ...MONTHS.map((m) => `${m} ${new Date().getFullYear()}`).filter((x) => x !== curMonth())].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Amount (KSh)</label>
                <input
                  type="number"
                  min={settings.min}
                  value={recAmt}
                  onChange={(e) => setRecAmt(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="field">
                <label>Payment reference (M-PESA / Slip no.)</label>
                <input
                  value={recRef}
                  onChange={(e) => setRecRef(e.target.value)}
                  placeholder="e.g., QX89K90L"
                  required
                />
              </div>

              <button type="submit" className="btn pri">
                Record contribution
              </button>
            </form>
          </div>

          <div className="panel rv">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Contributions ledger</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn gho sm"
                  onClick={() => {
                    const headers = ['Record Type', 'ID / Ref', 'Member ID', 'Month', 'Method', 'Amount (KSh)', 'Status'];
                    const rows = contribs.map(c => ['Contribution', c.id, c.m, c.month, c.method || 'M-PESA', c.amt, c.status]);
                    exportToCSV('kilifi-kecsha-contributions-ledger', headers, rows);
                  }}
                >
                  <Download className="ic" style={{ width: '13px' }} /> Excel (Contribs)
                </button>
                <button
                  type="button"
                  className="btn gho sm"
                  onClick={() => exportToPDF('Kilifi County KECSHA Contributions Ledger Report')}
                >
                  <Printer className="ic" style={{ width: '13px' }} /> PDF (Contribs)
                </button>
              </div>
            </div>
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Member</th>
                    <th>Month</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Ref</th>
                    <th>Amount</th>
                    <th>Evidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contribs.map((c) => (
                    <tr key={c.id}>
                      <td className="mono">{c.id}</td>
                      <td>{memberName(c.m)}</td>
                      <td>{c.month}</td>
                      <td>{c.date}</td>
                      <td>{c.method || '—'}</td>
                      <td className="mono">{c.ref}</td>
                      <td className="mono">{money(c.amt)}</td>
                      <td>
                        {c.evidence ? (
                          <a href={c.evidence} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>
                            View receipt
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {c.status === 'Pending Verification' ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn sm gld"
                              onClick={() => onVerifyContrib(c)}
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              className="btn sm dng"
                              onClick={() => {
                                const r = prompt('Reason for rejection:');
                                if (r) onRejectContrib(c, r);
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <Pill status={c.status} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {page === 'payments' && (
        <>
          <div className="panel rv">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Welfare disbursements history</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn gho sm"
                  onClick={() => {
                    const headers = ['Voucher', 'Case', 'Paid To', 'Date', 'Ref', 'Amount (KSh)'];
                    const rows = payouts.map(p => [p.id, p.case, p.to, p.date, p.ref, p.amt]);
                    exportToCSV('kilifi-kecsha-payouts-history', headers, rows);
                  }}
                >
                  <Download className="ic" style={{ width: '13px' }} /> Excel (Payouts)
                </button>
                <button
                  type="button"
                  className="btn gho sm"
                  onClick={() => exportToPDF('Kilifi County KECSHA Payouts & Disbursements Report')}
                >
                  <Printer className="ic" style={{ width: '13px' }} /> PDF (Payouts)
                </button>
              </div>
            </div>
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Voucher</th>
                    <th>Case</th>
                    <th>Paid To</th>
                    <th>Date</th>
                    <th>Ref</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length > 0 ? (
                    payouts.map((p) => (
                      <tr key={p.id}>
                        <td className="mono">{p.id}</td>
                        <td className="mono">{p.case}</td>
                        <td>{p.to}</td>
                        <td>{p.date}</td>
                        <td className="mono">{p.ref}</td>
                        <td className="mono">{money(p.amt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: 'var(--mut)' }}>
                        No disbursements executed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {page === 'welfare' && (
        <div className="panel rv">
          <h3>Ready for payment (Chairperson approved)</h3>
          <p className="psub">
            Payment gate: only Chairperson-approved cases can be paid out. Enter transaction reference on disbursement.
          </p>
          {readyForPayment.length > 0 ? (
            readyForPayment.map((c) => (
              <div key={c.id} className="caserow rv">
                <div className="ch">
                  <b>{c.id}</b> <span className="pill p-b">{c.type}</span>
                  <Pill status={c.status} />
                  <span className="amt">{money(c.amt)}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--mut)' }}>
                  Payee: <b style={{ color: 'var(--ink)' }}>{c.ben}</b> ({c.member}) · Approved
                </div>
                {c.note && <p style={{ fontSize: '12.8px', marginTop: '6px' }}>{c.note}</p>}
                <div className="actions">
                  <button
                    type="button"
                    className="btn gld sm"
                    onClick={() => handleDisbursementClick(c)}
                  >
                    <Coins className="ic" /> Record disbursement
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--mut)', fontSize: '13.5px' }}>
              No cases currently approved for payment.
            </p>
          )}
        </div>
      )}

      {page === 'statements' && (
        <div className="grid2">
          <div className="panel rv">
            <h3>Statement of the Fund</h3>
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Line Item</th>
                    <th>Amount (KSh)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total verified member contributions</td>
                    <td className="mono">{sumVerified.toLocaleString('en-KE')}</td>
                  </tr>
                  <tr>
                    <td>Less: Welfare assistance disbursed</td>
                    <td className="mono" style={{ color: 'var(--red)' }}>
                      ({sumPayouts.toLocaleString('en-KE')})
                    </td>
                  </tr>
                  <tr style={{ background: 'var(--green3)', fontWeight: 'bold' }}>
                    <td>Fund balance</td>
                    <td className="mono">{(sumVerified - sumPayouts).toLocaleString('en-KE')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel rv">
            <h3>Fund statistics</h3>
            <p className="psub">
              Active members contributing this month: <b>{new Set(verified.filter((c) => c.month === curMonth()).map((c) => c.m)).size}</b>
            </p>
            <p className="psub">
              Total member receipts on record: <b>{verified.length}</b> verified, <b>{pendingEvidence.length}</b> pending
            </p>
          </div>
        </div>
      )}

      {page === 'recon' && (
        <div className="panel rv">
          <h3>Payment reconciliation (Bank / Paybill)</h3>
          <p className="psub">
            Compare verified receipts against your official Paybill or bank statement. Toggle matched status.
          </p>
          <div className="twrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {verified.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.id}</td>
                    <td className="mono">{c.ref}</td>
                    <td className="mono">{money(c.amt)}</td>
                    <td>
                      {c.matched ? (
                        <>
                          <Pill status="Matched" />{' '}
                          <button
                            type="button"
                            className="btn sm gho"
                            onClick={() => onToggleReconciliation(c)}
                          >
                            Unmatch
                          </button>
                        </>
                      ) : (
                        <>
                          <Pill status="Unmatched" />{' '}
                          <button
                            type="button"
                            className="btn sm gld"
                            onClick={() => onToggleReconciliation(c)}
                          >
                            Mark matched
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {page === 'audit' && (
        <div className="panel rv">
          <h3>Financial audit trail</h3>
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
              onClick={() => {
                const headers = ['Time', 'Actor', 'Action', 'Detail'];
                const rows = auditLog.map(a => [a.t, a.who, a.act, a.det]);
                exportToCSV('treasurer-audit-trail', headers, rows);
              }}
            >
              <Download className="ic" style={{ width: '14px' }} /> Download Excel / CSV
            </button>
            <button
              type="button"
              className="btn gho sm"
              onClick={() => exportToPDF('Treasurer Financial Audit Trail')}
            >
              <Printer className="ic" style={{ width: '14px' }} /> Download PDF / Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
