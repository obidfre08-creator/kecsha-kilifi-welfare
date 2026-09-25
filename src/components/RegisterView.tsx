import React, { useState } from 'react';
import { Crest } from './Crest';
import { Member } from '../types';
import { sha256, compressImage } from '../services/firestoreService';

interface RegisterViewProps {
  onBackToLogin: () => void;
  onSubmitRegistration: (member: Member) => Promise<void>;
  logo: string | null;
  members: Member[];
  onOpenCrop: (src: string, aspect: number, cb: (dataUrl: string) => void) => void;
  onShowToast: (msg: string, kind?: 'info' | 'err') => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onBackToLogin,
  onSubmitRegistration,
  logo,
  members,
  onOpenCrop,
  onShowToast,
}) => {
  const [position, setPosition] = useState<'Member' | 'Chairperson' | 'Secretary' | 'Treasurer'>('Member');
  const [name, setName] = useState('');
  const [tsc, setTsc] = useState('');
  const [idno, setIdno] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');

  // Beneficiary
  const [bn, setBn] = useState('');
  const [bid, setBid] = useState('');
  const [brel, setBrel] = useState('Spouse');
  const [bphone, setBphone] = useState('');

  // Next of kin
  const [kn, setKn] = useState('');
  const [kid, setKid] = useState('');
  const [kphone, setKphone] = useState('');

  // Credentials
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');

  // Photos
  const [photo, setPhoto] = useState<string | null>(null);
  const [benPhoto, setBenPhoto] = useState<string | null>(null);
  const [scan, setScan] = useState<string | null>(null);

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickFile = (cb: (dataUrl: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          cb(reader.result);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleMemberPhotoUpload = () => {
    pickFile((src) => {
      onOpenCrop(src, 45 / 35, (cropped) => {
        setPhoto(cropped);
        onShowToast('Applicant photo cropped to <b>35 × 45 mm</b>');
      });
    });
  };

  const handleBenPhotoUpload = () => {
    pickFile((src) => {
      onOpenCrop(src, 45 / 35, (cropped) => {
        setBenPhoto(cropped);
        onShowToast('Beneficiary photo cropped to <b>35 × 45 mm</b>');
      });
    });
  };

  const handleScanUpload = () => {
    pickFile(async (src) => {
      const compressed = await compressImage(src, 800, 0.7);
      setScan(compressed);
      onShowToast('Scanned ID card attached');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !tsc || !idno || !phone || !school) {
      onShowToast('Please fill in all applicant details', 'err');
      return;
    }
    if (!bn || !bid || !bphone) {
      onShowToast('Please fill in beneficiary details', 'err');
      return;
    }
    if (!kn || !kid || !kphone) {
      onShowToast('Please fill in next of kin details', 'err');
      return;
    }
    if (!user || !pass) {
      onShowToast('Please choose a username and password', 'err');
      return;
    }
    if (pass !== pass2) {
      onShowToast('Passwords do not match', 'err');
      return;
    }
    if (pass.length < 6) {
      onShowToast('Password must be at least 6 characters', 'err');
      return;
    }
    if (!photo) {
      onShowToast('Your <b>35 × 45 mm</b> photograph is required', 'err');
      return;
    }
    if (!benPhoto) {
      onShowToast('Beneficiary <b>35 × 45 mm</b> photograph is required', 'err');
      return;
    }
    if (!scan) {
      onShowToast('Scanned national ID card is required', 'err');
      return;
    }
    if (!consent) {
      onShowToast('You must accept the Constitution and monthly contribution commitment', 'err');
      return;
    }

    const cleanUser = user.trim().toLowerCase();
    if (members.some((m) => m.user.toLowerCase() === cleanUser)) {
      onShowToast('That username is already taken. Please pick another.', 'err');
      return;
    }
    if (members.some((m) => m.idno.trim() === idno.trim())) {
      onShowToast('A member with this National ID number already exists.', 'err');
      return;
    }

    setSubmitting(true);
    try {
      const nextId = `KCW-${String(members.length + 1).padStart(3, '0')}`;
      const hashedPass = await sha256(pass);

      const newMember: Member = {
        id: nextId,
        name: name.trim(),
        school: school.trim(),
        phone: phone.trim(),
        tsc: tsc.trim(),
        idno: idno.trim(),
        position,
        role: '—',
        joined: '—',
        status: 'Pending Verification',
        months: 0,
        total: 0,
        photo,
        scan,
        user: cleanUser,
        pass: hashedPass,
        ben: {
          n: bn.trim(),
          id: bid.trim(),
          r: brel,
          p: bphone.trim(),
          photo: benPhoto,
          s: 'Pending Verification',
        },
        nok: {
          n: kn.trim(),
          id: kid.trim(),
          p: kphone.trim(),
        },
      };

      await onSubmitRegistration(newMember);
      onShowToast(
        `Registration received — member number <b>${nextId}</b>. ${
          position === 'Chairperson'
            ? 'The Administrator will review and activate you.'
            : 'The Chairperson will review and activate you.'
        } Then sign in with username <b>${cleanUser}</b>.`
      );
      onBackToLogin();
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save registration to Firestore database.', 'err');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="regPage">
      <div className="band"></div>
      <div className="regwrap2">
        <div className="reghead rv">
          <Crest size={48} logo={logo} />
          <div>
            <div className="overline">Kilifi County KECSHA Welfare Association</div>
            <h2>Member Registration</h2>
            <p>
              Admission under Article 4 · fields marked <b style={{ color: 'var(--red)' }}>*</b> are required · photographs are cropped to <b>35 × 45 mm</b> in your browser · the Chairperson registers here too
            </p>
          </div>
          <button type="button" className="btn gho" onClick={onBackToLogin} style={{ marginLeft: 'auto' }}>
            ← Back to sign in
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sect rv">
            <h3>1 · Applicant details</h3>
            <p className="psub">
              Serving head teacher of a school in Kilifi County. Chairperson applications are approved by the System Administrator; all others are approved by the Chairperson.
            </p>
            <div className="regcols">
              <div className="form3">
                <div className="field">
                  <label>Position applying for *</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                  >
                    <option value="Member">Member</option>
                    <option value="Chairperson">Chairperson</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                  </select>
                </div>
                <div className="field">
                  <label>Full name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Mary W. Kamau"
                    required
                  />
                </div>
                <div className="field">
                  <label>TSC number *</label>
                  <input
                    value={tsc}
                    onChange={(e) => setTsc(e.target.value)}
                    placeholder="e.g., 1234567"
                    required
                  />
                </div>
                <div className="field">
                  <label>National ID number *</label>
                  <input
                    value={idno}
                    onChange={(e) => setIdno(e.target.value)}
                    placeholder="e.g., 23456789"
                    required
                  />
                </div>
                <div className="field">
                  <label>Phone number *</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    required
                  />
                </div>
                <div className="field">
                  <label>School *</label>
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g., Vipingo Primary"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="upbox" style={{ minHeight: '190px' }}>
                  {photo ? (
                    <>
                      <img className="ph-prev" src={photo} alt="Applicant preview" />
                      <span>
                        Your photo
                        <br />
                        <b style={{ color: 'var(--green)' }}>35 × 45 mm ✓</b>
                      </span>
                    </>
                  ) : (
                    <span>
                      Your real passport photo
                      <br />
                      <b style={{ color: 'var(--goldD)' }}>35 × 45 mm</b>
                      <br />
                      plain background preferred
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn pri sm"
                  onClick={handleMemberPhotoUpload}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '9px' }}
                >
                  Upload & crop photo *
                </button>
                <small style={{ color: 'var(--mut)', fontSize: '11px', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                  Your real passport photo · 35 × 45 mm
                </small>
              </div>
            </div>
          </div>

          <div className="sect rv" style={{ animationDelay: '0.07s' }}>
            <h3>2 · Written beneficiary (Article 7)</h3>
            <p className="psub">
              The person who receives the death benefit of KSh 150,000 upon a verified claim.
            </p>
            <div className="regcols">
              <div className="form3">
                <div className="field">
                  <label>Beneficiary full name *</label>
                  <input
                    value={bn}
                    onChange={(e) => setBn(e.target.value)}
                    placeholder="e.g., Agnes B. Baya"
                    required
                  />
                </div>
                <div className="field">
                  <label>Beneficiary ID number *</label>
                  <input
                    value={bid}
                    onChange={(e) => setBid(e.target.value)}
                    placeholder="e.g., 34567890"
                    required
                  />
                </div>
                <div className="field">
                  <label>Relationship *</label>
                  <select value={brel} onChange={(e) => setBrel(e.target.value)}>
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
                  <label>Beneficiary phone number *</label>
                  <input
                    value={bphone}
                    onChange={(e) => setBphone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="upbox" style={{ minHeight: '190px' }}>
                  {benPhoto ? (
                    <>
                      <img className="ph-prev" src={benPhoto} alt="Beneficiary preview" />
                      <span>
                        Beneficiary photo
                        <br />
                        <b style={{ color: 'var(--green)' }}>35 × 45 mm ✓</b>
                      </span>
                    </>
                  ) : (
                    <span>
                      Beneficiary passport photo
                      <br />
                      <b style={{ color: 'var(--goldD)' }}>35 × 45 mm</b>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn pri sm"
                  onClick={handleBenPhotoUpload}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '9px' }}
                >
                  Beneficiary photo *
                </button>
                <small style={{ color: 'var(--mut)', fontSize: '11px', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                  Passport format 35 × 45 mm
                </small>
              </div>
            </div>
          </div>

          <div className="sect rv" style={{ animationDelay: '0.14s' }}>
            <h3>3 · Identification & next of kin</h3>
            <p className="psub">
              A clear scan of the national ID card and the person to contact in an emergency.
            </p>
            <div className="regcols">
              <div className="form3">
                <div className="field">
                  <label>Next of kin — full name *</label>
                  <input
                    value={kn}
                    onChange={(e) => setKn(e.target.value)}
                    placeholder="e.g., John B. Baya"
                    required
                  />
                </div>
                <div className="field">
                  <label>Next of kin — ID number *</label>
                  <input
                    value={kid}
                    onChange={(e) => setKid(e.target.value)}
                    placeholder="e.g., 12398765"
                    required
                  />
                </div>
                <div className="field">
                  <label>Next of kin — phone number *</label>
                  <input
                    value={kphone}
                    onChange={(e) => setKphone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="upbox" style={{ minHeight: '190px' }}>
                  {scan ? (
                    <>
                      <img className="scan-prev" src={scan} alt="ID scan preview" />
                      <span>
                        <b style={{ color: 'var(--green)' }}>Scanned ID attached ✓</b>
                      </span>
                    </>
                  ) : (
                    <span>
                      Scanned national ID card
                      <br />
                      <b style={{ color: 'var(--goldD)' }}>JPG / PNG</b>
                      <br />
                      front of the ID
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn pri sm"
                  onClick={handleScanUpload}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '9px' }}
                >
                  Upload scanned ID card *
                </button>
                <small style={{ color: 'var(--mut)', fontSize: '11px', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                  JPG or PNG · front of national ID
                </small>
              </div>
            </div>
          </div>

          <div className="sect rv" style={{ animationDelay: '0.2s' }}>
            <h3>4 · Login credentials</h3>
            <p className="psub">
              Choose the username and password you will use to sign in after your registration is approved.
            </p>
            <div className="form3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="field">
                <label>Choose username *</label>
                <input
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="e.g., marykamau"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="field">
                <label>Create password *</label>
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="field">
                <label>Confirm password *</label>
                <input
                  type="password"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I accept the Constitution of the Association and commit to a monthly contribution of at least <b>KSh 1,000</b>. Admission completes upon approval (Administrator for the Chairperson; Chairperson for all others) and the first receipted contribution.
            </span>
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              className="btn pri"
              disabled={submitting}
              style={{ flex: 1, justifyContent: 'center', padding: '13px' }}
            >
              {submitting ? 'Saving to Firebase database...' : 'Submit registration'}
            </button>
            <button type="button" className="btn gho" onClick={onBackToLogin}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
