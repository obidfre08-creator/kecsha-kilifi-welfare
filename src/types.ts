export type UserRole = 'admin' | 'chair' | 'secretary' | 'treasurer' | 'member';

export interface Beneficiary {
  n: string;
  id: string;
  r: string; // relationship
  p: string; // phone
  photo: string | null;
  s: string; // status: 'Pending Verification' | 'Verified' | 'Not Registered'
}

export interface NextOfKin {
  n: string;
  id: string;
  p: string;
}

export interface Member {
  id: string; // e.g. KCW-001
  name: string;
  school: string;
  phone: string;
  tsc: string;
  idno: string;
  position: 'Member' | 'Chairperson' | 'Secretary' | 'Treasurer';
  role: string; // '—' | 'Chairperson' | 'Secretary' | 'Treasurer'
  joined: string;
  status: 'Pending Verification' | 'Active' | 'Declined' | 'On Leave';
  months: number;
  total: number;
  photo: string | null;
  scan: string | null;
  user: string;
  pass: string; // sha256 hash or initial password
  ben: Beneficiary;
  nok: NextOfKin;
  arrears?: string;
}

export interface Contrib {
  id: string; // e.g. CT-1001
  m: string; // member id
  month: string;
  amt: number;
  ref: string;
  method?: string;
  date: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected';
  v: boolean;
  evidence: string | null;
  by?: string;
  note?: string;
  matched?: boolean;
}

export interface Payout {
  id: string; // e.g. PO-0001
  case: string;
  to: string;
  amt: number;
  date: string;
  ref: string;
}

export interface WelfareCase {
  id: string; // e.g. WC-2026-001
  type: string;
  member: string;
  ben: string;
  amt: number;
  status: 'Awaiting Documents' | 'Pending Approval' | 'Approved for Payment' | 'Paid' | 'Rejected';
  opened: string;
  note?: string;
  docs: Record<string, boolean>;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  venue: string;
  att?: string;
  agendaStatus: 'Draft' | 'Approved';
  agenda: string[];
  minutes?: string;
}

export interface Announcement {
  id?: string;
  date: string;
  txt: string;
  ts?: number;
}

export interface AppNotification {
  id?: string;
  role: UserRole;
  u: boolean; // unread flag
  txt: string;
  ts?: number;
}

export interface AuditEntry {
  id?: string;
  t: string;
  ts: number;
  who: string;
  act: string;
  det: string;
}

export interface WelfareSettings {
  min: number;
  death: number;
  emer: number;
  sms: boolean;
  dual: boolean;
}

export interface Officer {
  name: string;
  status: 'Active' | 'Vacant' | 'On Leave';
}

export interface Credential {
  u: string;
  p: string;
}

export interface BrandConfig {
  logo: string | null;
}
