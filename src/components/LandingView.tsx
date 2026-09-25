import React, { useState } from 'react';
import { Crest } from './Crest';
import { UserRole, Member, Credential } from '../types';
import { sha256 } from '../services/firestoreService';

interface LandingViewProps {
  onLogin: (role: UserRole, memberId?: string) => void;
  onOpenRegister: () => void;
  logo: string | null;
  members: Member[];
  creds: Record<string, Credential>;
  onShowToast: (msg: string, kind?: 'info' | 'err') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLogin,
  onOpenRegister,
  logo,
  members,
  creds,
  onShowToast,
}) => {
  const [role, setRole] = useState<UserRole>('member');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      onShowToast('Enter your username and password', 'err');
      return;
    }

    setLoading(true);
    try {
      const hp = await sha256(p);
      const matchesPassword = (stored: string) => stored === hp || stored === p;

      if (role === 'member') {
        const found = members.find(
          (m) =>
            m.user.toLowerCase() === u ||
            m.id.toLowerCase() === u ||
            m.idno.toLowerCase() === u ||
            m.name.toLowerCase() === u
        );

        if (!found) {
          onShowToast('Username not found in members registry — please register first', 'err');
          setLoading(false);
          return;
        }

        if (!matchesPassword(found.pass)) {
          onShowToast(`Incorrect password for <b>${found.name}</b>`, 'err');
          setLoading(false);
          return;
        }

        if (found.status === 'Pending Verification') {
          const approver = found.position === 'Chairperson' ? 'the Administrator’s' : 'the Chairperson’s';
          onShowToast(
            `Your registration is <b>awaiting ${approver} approval</b>. Please check back shortly.`,
            'err'
          );
          setLoading(false);
          return;
        }

        if (found.status === 'Declined') {
          onShowToast('This registration was declined — please contact the Secretary.', 'err');
          setLoading(false);
          return;
        }

        onLogin('member', found.id);
      } else {
        const cr = creds[role];
        if (!cr || cr.u === '—') {
          onShowToast('This office has not been activated yet.', 'err');
          setLoading(false);
          return;
        }

        if (u !== cr.u.toLowerCase() || !matchesPassword(cr.p)) {
          onShowToast('Incorrect username or password for this office.', 'err');
          setLoading(false);
          return;
        }

        onLogin(role);
      }
    } catch (err) {
      console.error(err);
      onShowToast('Error signing in. Please check your details.', 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPrefill = (e: React.MouseEvent) => {
    e.preventDefault();
    setRole('admin');
    setUsername('admin@kecsha.co.ke');
    onShowToast('Administrator username prefilled — default password is <b>admin123</b>');
  };

  return (
    <div id="landing">
      <div className="band"></div>
      <div className="lwrap">
        <div className="lhead rv">
          <div className="brand">
            <Crest size={56} logo={logo} />
            <div>
              <b>
                Kilifi County KECSHA
                <br />
                Welfare Association
              </b>
              <small>Head Teachers · Kilifi County</small>
            </div>
          </div>
          <div className="lest">
            Registered welfare association
            <br />
            Kilifi · Kenya · Est. 2023
          </div>
        </div>

        <div className="lgrid">
          <div className="rv" style={{ animationDelay: '0.08s' }}>
            <div className="overline">Mfuko wa Misaada · Head Teachers' Welfare Fund</div>
            <h1>
              Those who lead our schools <em>should never</em> carry grief alone.
            </h1>
            <p className="swa">
              “Haba na haba hujaza kibaba.” — From KSh 1,000 a month, we build a fund that stands beside every head teacher in Kilifi County through death, emergency and need.
            </p>
            <div className="facts">
              <div className="fact">
                <b>KSh 1,000</b> minimum monthly contribution
              </div>
              <div className="fact">
                <b>KSh 150,000</b> death benefit → written beneficiary
              </div>
              <div className="fact">
                <b>KSh 30,000</b> emergency assistance cap
              </div>
              <div className="fact">
                <b>35 × 45 mm</b> member & beneficiary photos
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#9CCBA4', fontSize: '13px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#48bb78', display: 'inline-block' }} />
              <span>Real-time Firebase Firestore database connected & synchronizing across all devices</span>
            </div>
          </div>

          <div className="gate rv auth" style={{ animationDelay: '0.16s' }}>
            <h2>Sign in</h2>
            <p>Select your role, enter your username and password.</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  required
                >
                  <option value="member">Member / Head Teacher</option>
                  <option value="chair">Chairperson</option>
                  <option value="secretary">Secretary</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="field">
                <label>Username *</label>
                <input
                  type="text"
                  placeholder="e.g., your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="field">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="btn gld" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign in →'}
              </button>

              <button
                type="button"
                className="btn"
                onClick={onOpenRegister}
                style={{
                  marginTop: '11px',
                  background: '#0F4735',
                  color: '#EAF1E7',
                  border: '1px solid #ffffff2e',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                New member? Register here →
              </button>

              <p className="hint">
                <b style={{ color: 'var(--gold)' }}>System Administrator:</b> username{' '}
                <b>admin@kecsha.co.ke</b> · default password <b>admin123</b> — you will change it after first sign-in.
                <br />
                <a href="#admin" onClick={handleAdminPrefill} style={{ color: 'var(--gold)' }}>
                  System administrator access →
                </a>
                <br />
                <br />
                <b>All other roles:</b> register below. The <b>Administrator</b> approves & activates the <b>Chairperson</b>; the <b>Chairperson</b> approves the <b>Secretary, Treasurer and all members</b> — credentials come from your registration.
              </p>
            </form>
          </div>
        </div>

        <div className="lfoot rv" style={{ animationDelay: '0.24s' }}>
          <span>© 2026 Kilifi County KECSHA Welfare Association · Kilifi County, Kenya</span>
          <span>⚡ Live cloud synchronization powered by Firebase Firestore</span>
        </div>
      </div>
    </div>
  );
};
