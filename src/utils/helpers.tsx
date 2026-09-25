import React from 'react';
import {
  Grid,
  Users,
  Shield,
  Stamp,
  FileText,
  Coins,
  Calendar,
  BookOpen,
  Settings,
  Bell,
  AlertTriangle,
  BarChart2,
  Megaphone,
  Book,
  Camera,
  Lock,
  CheckCircle2,
  Clock,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { Member } from '../types';

export const money = (n: number | string) => 'KSh ' + Number(n || 0).toLocaleString('en-KE');

export const initials = (name: string) => {
  if (!name) return '—';
  const parts = name.split(' ').filter((w) => /^[A-Za-z]/.test(w));
  return parts.slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '—';
};

export const PC: Record<string, string> = {
  Active: 'g',
  Paid: 'g',
  Verified: 'g',
  Matched: 'g',
  Available: 'g',
  'Approved for Payment': 'b',
  'Pending Approval': 'y',
  'Pending Verification': 'y',
  'Awaiting Documents': 'y',
  'Pending Review': 'y',
  Draft: 'gr',
  'On Leave': 'y',
  Vacant: 'gr',
  'Not Registered': 'gr',
  'Not Recorded': 'gr',
  Closed: 'gr',
  Deceased: 'gr',
  Overdue: 'r',
  Rejected: 'r',
  Declined: 'r',
  Unmatched: 'y',
};

export const Pill: React.FC<{ status: string }> = ({ status }) => {
  const code = PC[status] || 'gr';
  return <span className={`pill p-${code}`}>{status}</span>;
};

export const PhotoBox: React.FC<{ member: Member; big?: boolean }> = ({ member, big }) => {
  const cls = big ? 'big' : '';
  if (member.photo) {
    return <img className={`photo ${cls}`} src={member.photo} alt={member.name} />;
  }
  return <div className={`photo ph ${cls}`}>{initials(member.name)}</div>;
};

export const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  val: number | string;
  sub: string;
  tone: string;
  pre?: string;
}> = ({ icon, label, val, sub, tone, pre = '' }) => {
  const displayVal = typeof val === 'number' ? pre + val.toLocaleString('en-KE') : pre + val;
  return (
    <div className="tile rv" style={{ ['--tc' as any]: tone }}>
      <div className="tl">
        {icon} {label}
      </div>
      <div className="tv">{displayVal}</div>
      <div className="ts">{sub}</div>
    </div>
  );
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const curMonth = () => `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
export const todayStr = () =>
  new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });

export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (title: string) => {
  window.print();
};

