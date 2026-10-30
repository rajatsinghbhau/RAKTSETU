import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Droplet,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
  X,
  Zap
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { BloodGroup, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('DONOR');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('A+');
  const [city, setCity] = useState('Mumbai');
  const [area, setArea] = useState('Worli');
  const [fullAddress, setFullAddress] = useState('Flat 402, Lotus Sea View Apts, Dr. Annie Besant Road');
  const [pincode, setPincode] = useState('400018');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!phone.trim()) {
          throw new Error('Mobile number is required for WhatsApp emergency alerts.');
        }
        if (role === 'DONOR' && !fullAddress.trim()) {
          throw new Error('Full address is required to calculate proximity to nearby hospitals.');
        }

        await RealBackendService.signUp({
          email,
          password,
          fullName,
          role,
          phone: phone.trim(),
          bloodGroup: role === 'DONOR' ? bloodGroup : undefined,
          city: role === 'DONOR' ? city.trim() : undefined,
          approximateArea: role === 'DONOR' ? area.trim() : undefined,
          fullAddress: role === 'DONOR' ? fullAddress.trim() : undefined,
          pincode: role === 'DONOR' ? pincode.trim() : undefined,
        });
      } else {
        await RealBackendService.signIn(email, password);
      }
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Authentication operation failed.');
    }
  };

  const handleQuickDemo = async (roleType: 'COORDINATOR' | 'DONOR' | 'OPERATOR') => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await RealBackendService.quickRoleLogin(roleType);
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Quick login failed.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px', background: '#ffffff', color: '#0f172a' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff' }}>
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                {isSignUp ? 'Register Verified Account' : 'Sign In to RAKTSETU'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Live PostgreSQL Session &bull; Role-Based Security
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
            {/* 1-Click Demo Access Bar */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Zap size={14} />
                <span>1-Click Instant Demo Login:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                <button
                  type="button"
                  style={{ background: '#ffffff', border: '1px solid #fed7aa', color: '#c2410c', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => handleQuickDemo('COORDINATOR')}
                  disabled={loading}
                >
                  🏥 Hospital
                </button>
                <button
                  type="button"
                  style={{ background: '#ffffff', border: '1px solid #fecdd3', color: '#be123c', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => handleQuickDemo('DONOR')}
                  disabled={loading}
                >
                  🩸 A+ Donor
                </button>
                <button
                  type="button"
                  style={{ background: '#ffffff', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => handleQuickDemo('OPERATOR')}
                  disabled={loading}
                >
                  ❄️ Blood Bank
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '10px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            {/* Mode Switch Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: !isSignUp ? '#ffffff' : 'transparent',
                  color: !isSignUp ? '#0f172a' : '#64748b',
                  boxShadow: !isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
              >
                Sign In
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: isSignUp ? '#ffffff' : 'transparent',
                  color: isSignUp ? '#0f172a' : '#64748b',
                  boxShadow: isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
              >
                Register New Account
              </button>
            </div>

            {isSignUp && (
              <>
                {/* Full Legal Name */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma / Rohan Mehta"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.25rem' }}
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Operational Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.25rem' }}
                  >
                    <option value="DONOR">Blood Donor (Receive alerts near you & mobilize)</option>
                    <option value="HOSPITAL_COORDINATOR">Hospital Coordinator (Emergency clinical triage)</option>
                    <option value="BLOOD_CENTRE_OPERATOR">Blood Centre Operator (Cold storage inventory)</option>
                  </select>
                </div>

                {/* Mobile Number (Mandatory for Donors & all participants) */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={14} color="#16a34a" />
                    <span>WhatsApp Mobile Number * (for emergency dispatch)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.25rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                    Include country code (+91 for India). Used to send urgent 1-click WhatsApp alerts.
                  </span>
                </div>

                {/* Donor-Specific Location & Blood Group Fields */}
                {role === 'DONOR' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e11d48', fontSize: '0.8rem', fontWeight: 800 }}>
                      <MapPin size={16} />
                      <span>Donor Proximity & Hospital Vicinity Matching</span>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Blood Group *</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.25rem' }}
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    {/* Full Address for Proximity Filtering */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                        Full Street Address & Residence *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        placeholder="House / Flat No., Building, Street & Landmark (e.g. Flat 402, Lotus Towers, Worli Sea Face)"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.25rem', fontFamily: 'inherit' }}
                      />
                      <span style={{ fontSize: '0.68rem', color: '#16a34a', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                        ✓ We only send WhatsApp alerts when an emergency blood deficit occurs near your hospital vicinity.
                      </span>
                    </div>

                    {/* City, Area, Pincode in 3 columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Locality / Area *</label>
                        <input
                          type="text"
                          required
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g. Worli"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.2rem', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>City *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Mumbai"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.2rem', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Pincode *</label>
                        <input
                          type="text"
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="400018"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.2rem', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Address */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com / doctor@hospital.org"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.25rem' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.25rem' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', background: '#f8fafc' }}>
            <button
              type="button"
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.55rem 1.15rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: isSignUp ? 'linear-gradient(135deg, #e11d48, #be123c)' : '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.35rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: isSignUp ? '0 4px 14px rgba(225, 29, 72, 0.3)' : '0 4px 14px rgba(15, 23, 42, 0.25)',
              }}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Supabase Account' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
