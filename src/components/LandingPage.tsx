import React from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Droplet,
  Heart,
  Lock,
  LogOut,
  MessageCircle,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { Profile } from '../types';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
  onRoleLogin: (role: 'COORDINATOR' | 'DONOR' | 'OPERATOR') => Promise<void>;
  isLoggedIn: boolean;
  currentUserProfile?: Profile | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenAuth,
  onRoleLogin,
  isLoggedIn,
  currentUserProfile,
}) => {
  const userRole = currentUserProfile?.role;

  const getDashboardForRole = (role?: string) => {
    if (role === 'HOSPITAL_COORDINATOR' || role === 'HOSPITAL_ADMIN') return 'hospital';
    if (role === 'DONOR') return 'donor';
    if (role === 'BLOOD_CENTRE_OPERATOR' || role === 'BLOOD_CENTRE_ADMIN') return 'bloodcentre';
    return 'command';
  };

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto' }}>
      {/* Browser Window Frame Wrapper matching reference image */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          overflow: 'hidden',
          marginBottom: '3rem',
        }}
      >
        {/* Browser Top Window Bar */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* macOS 3 Window Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
          </div>

          {/* Center Address Pill */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '9999px',
              padding: '0.25rem 1.25rem',
              fontSize: '0.75rem',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '280px',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <Search size={12} color="#94a3b8" />
            <span style={{ fontWeight: 600, color: '#334155' }}>raktsetu.network</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#e11d48', fontWeight: 700 }}>emergency-roles</span>
          </div>

          {/* Right Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
            ONLINE
          </div>
        </div>

        {/* Hero Gradient Canvas */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 30%, #8b5cf6 65%, #ec4899 100%)',
            padding: '3.5rem 3rem 0',
            position: 'relative',
            overflow: 'hidden',
            color: '#ffffff',
          }}
        >
          {/* Subtle Ambient Decorative Circles */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              right: '5%',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* 2-Column Split Hero Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              alignItems: 'center',
              gap: '3rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Left Column: Headline, minimal subtext, pill buttons */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.35rem 0.9rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Droplet size={14} fill="#fff" />
                <span>ROLE-BASED EMERGENCY PLATFORM</span>
              </div>

              <h1
                style={{
                  fontSize: '3.1rem',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-0.025em',
                  marginBottom: '1rem',
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.15)',
                }}
              >
                Manage all blood emergencies in one place
              </h1>

              <p
                style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.55,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '2rem',
                  maxWidth: '520px',
                }}
              >
                RAKTSETU connects 3 vital roles: <strong>Hospital ER Doctors</strong>, <strong>Verified Blood Donors</strong>, and <strong>Blood Bank Cold Storage</strong>. Select your role below to log in to your dashboard.
              </p>

              {/* Action Pill Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                {currentUserProfile ? (
                  <button
                    className="btn-pill-primary"
                    onClick={() => onNavigate(getDashboardForRole(userRole))}
                  >
                    <UserCheck size={16} />
                    Go to My Dashboard ({currentUserProfile.full_name.split(' ')[0]})
                  </button>
                ) : (
                  <button
                    className="btn-pill-primary"
                    onClick={() => {
                      const el = document.getElementById('roles-selection-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Users size={16} />
                    Select Role & Sign In
                  </button>
                )}
                <button
                  className="btn-pill-outline"
                  onClick={() => onNavigate('whatsapp')}
                  style={{ background: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(74, 222, 128, 0.6)' }}
                >
                  <MessageCircle size={16} />
                  WhatsApp Dispatch
                </button>
              </div>
            </div>

            {/* Right Column: 3D Smartphone Device Mockup & Floating Card matching reference */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', minHeight: '380px' }}>
              {/* iPhone Mockup Shell */}
              <div className="phone-shell">
                <div className="phone-notch" />
                <div className="phone-screen">
                  {/* Phone Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e11d48, #be123c)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        <Droplet size={14} fill="#fff" />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>RAKTSETU</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        background: '#fee2e2',
                        color: '#e11d48',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                      }}
                    >
                      LIVE DISPATCH
                    </span>
                  </div>

                  {/* Phone Main Emergency Card */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                      border: '1px solid #fecdd3',
                      borderRadius: '16px',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#e11d48' }}>URGENT REQUIREMENT</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569' }}>REQ-AIIMS-1001</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#e11d48' }}>A+</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>PRBC</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.6rem' }}>
                      AIIMS Apex Trauma Centre &bull; Resuscitation
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <div style={{ flex: 1, background: '#ffffff', padding: '0.35rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>NEEDED</div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>3</div>
                      </div>
                      <div style={{ flex: 1, background: '#ffffff', padding: '0.35rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 600 }}>SECURED</div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#16a34a' }}>0</div>
                      </div>
                      <div style={{ flex: 1, background: '#fffbeb', padding: '0.35rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 600 }}>DEFICIT</div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#d97706' }}>3</div>
                      </div>
                    </div>

                    {/* Quick WhatsApp Action Button inside Mockup */}
                    <button
                      onClick={() => onNavigate('whatsapp')}
                      style={{
                        width: '100%',
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                      }}
                    >
                      <MessageCircle size={13} /> Open WhatsApp Outreach
                    </button>
                  </div>

                  {/* Registered Donor Match Preview */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '0.6rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Rohan Mehta (A+)</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>+91 60068 53510 &bull; Ready</div>
                    </div>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      MATCH
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Companion Stats Card */}
              <div className="floating-card-mockup">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    LIVE SYSTEM HUD
                  </span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: '0.2rem' }}>
                  3 Units Needed
                </div>
                <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.6rem' }}>
                  1 Verified A+ Donor Mobilized
                </p>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '9999px',
                    background: '#e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: '33%', height: '100%', background: '#6366f1' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Smooth Bottom Wave Transition SVG */}
          <div style={{ marginTop: '3rem', marginLeft: '-3rem', marginRight: '-3rem', lineHeight: 0 }}>
            <svg
              viewBox="0 0 1440 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block', width: '100%', height: '70px' }}
            >
              <path
                d="M0,40 C320,110 440,0 720,50 C1000,100 1140,10 1440,40 L1440,120 L0,120 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* Stakeholder Roles & Access Section */}
        <div id="roles-selection-section" style={{ padding: '2.5rem 3rem 3.5rem', background: '#ffffff', color: '#0f172a' }}>
          {/* Active Session Callout if already logged in */}
          {currentUserProfile && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '16px',
                padding: '1rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532d' }}>
                    Active Session: {currentUserProfile.full_name} ({currentUserProfile.role.replace('_', ' ')})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                    You are already authenticated. Click below to jump straight into your operational dashboard.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  onClick={() => onNavigate(getDashboardForRole(userRole))}
                  style={{
                    background: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  Enter My Dashboard <ArrowRight size={14} />
                </button>
                <button
                  onClick={async () => {
                    await RealBackendService.signOut();
                    window.location.reload();
                  }}
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    borderRadius: '9999px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <LogOut size={13} /> Log Out
                </button>
              </div>
            </div>
          )}

          {/* Section Heading */}
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              STAKEHOLDER DASHBOARDS
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
              Select Your Role to Access Your Dashboard
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
              Each participant has a dedicated, secure portal. Log in with your credentials to access your specific clinical or operational tools.
            </p>
          </div>

          {/* The 3 Core Role Portals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Role 1: Hospital Emergency Coordinator */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #fecdd3',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={26} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#fee2e2', color: '#e11d48', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                    CLINICAL TRIAGE
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Hospital Emergency Portal
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
                  For emergency room coordinators and triage doctors. Log urgent blood requests with duplicate prevention, track live donor travel arrivals, and execute medical approvals.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <strong>Demo Account:</strong> <code>coord@aiims.edu</code> (AIIMS Apex Trauma)
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => onRoleLogin('COORDINATOR')}
                  style={{
                    width: '100%',
                    background: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
                  }}
                >
                  <Building2 size={16} /> Login as Hospital Coordinator <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Role 2: Verified Blood Donor */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #fde68a',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={26} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                    VOLUNTEER DONOR
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Registered Donor Hub
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
                  For registered blood donors. Receive matched ABO/Rh emergency alerts, respond with 1-click WhatsApp mobilization, update hospital transit status, and view donation history.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <strong>Demo Account:</strong> <code>donor.rohan@gmail.com</code> (Rohan Mehta, A+)
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => onRoleLogin('DONOR')}
                  style={{
                    width: '100%',
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                  }}
                >
                  <Users size={16} /> Login as Blood Donor <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Role 3: Blood Centre Operator */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e9d5ff',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Droplet size={26} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#f3e8ff', color: '#9333ea', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                    COLD STORAGE
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Blood Centre & Cold Inventory
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
                  For blood bank operators and cold-chain technicians. Manage verified cold units with row-lock reservations to guarantee zero double-allocations during emergency trauma.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <strong>Demo Account:</strong> <code>operator@redcross.org</code> (Red Cross Centre)
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => onRoleLogin('OPERATOR')}
                  style={{
                    width: '100%',
                    background: '#9333ea',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 14px rgba(147, 51, 234, 0.3)',
                  }}
                >
                  <Droplet size={16} /> Login as Blood Centre Operator <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Custom Login / Register / Command HUD bar */}
          <div
            style={{
              marginTop: '2.5rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Live Fulfilment Command Centre (System HUD)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Public overview of real-time blood deficit equation (Required - Secured = Outstanding)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => onNavigate('command')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #0284c7',
                  color: '#0284c7',
                  borderRadius: '9999px',
                  padding: '0.45rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                View System HUD
              </button>
              <button
                onClick={onOpenAuth}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.45rem 1.15rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                }}
              >
                <Lock size={13} /> Custom Sign In / Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
