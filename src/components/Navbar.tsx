import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Dna,
  Droplet,
  ExternalLink,
  Layers,
  Lock,
  LogOut,
  Menu,
  MessageCircle,
  Navigation,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { NotificationItem, Profile } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUserProfile: Profile | null;
  onOpenAuth: () => void;
  onRefreshData: () => void;
  notifications: NotificationItem[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUserProfile,
  onOpenAuth,
  onRefreshData,
  notifications,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    await RealBackendService.signOut();
    setCurrentTab('landing');
    onRefreshData();
  };

  const userRole = currentUserProfile?.role;

  // Strict Role-Based Navigation Definitions:
  // - GUEST: Only Overview & Sign In
  // - DONOR: Strictly 'donor' (My Donor Portal) - ALL OTHER TABS INVISIBLE
  // - HOSPITAL: hospital, command, tracking, whatsapp, genetic (+ admin if HOSPITAL_ADMIN)
  // - BLOOD_CENTRE: bloodcentre, command, tracking (+ admin if BLOOD_CENTRE_ADMIN)
  // - AUDITOR / SUPER_ADMIN: Governance & compliance oversight

  const getPrimaryDashboardForRole = (role?: string) => {
    if (!role) return 'landing';
    if (role === 'DONOR') return 'donor';
    if (role.startsWith('HOSPITAL')) return 'hospital';
    if (role.startsWith('BLOOD_CENTRE')) return 'bloodcentre';
    return 'command';
  };

  const isDonor = userRole === 'DONOR';
  const isHospital = userRole === 'HOSPITAL_COORDINATOR' || userRole === 'HOSPITAL_ADMIN';
  const isBloodCentre = userRole === 'BLOOD_CENTRE_OPERATOR' || userRole === 'BLOOD_CENTRE_ADMIN';
  const isAuditorOrAdmin = userRole === 'AUDITOR' || userRole === 'SUPER_ADMIN';

  return (
    <div className="floating-header-wrapper">
      <header className="floating-nav-pill">
        {/* Left: Brand Pill - Routes to user's dedicated primary role dashboard */}
        <div
          className="brand-pill"
          onClick={() => setCurrentTab(getPrimaryDashboardForRole(userRole))}
          title={`RAKTSETU - Go to ${userRole ? userRole.replace('_', ' ') + ' Dashboard' : 'Overview'}`}
        >
          <div className="brand-pill-logo">
            <Droplet size={18} fill="currentColor" />
          </div>
          <div>
            <span className="brand-pill-name">RAKTSETU</span>
          </div>
        </div>

        {/* Center: Nav Links (Desktop) - Strictly filtered per user role */}
        <nav className="pill-nav-links desktop-only">
          {/* Guest Only: Overview Tab */}
          {!currentUserProfile && (
            <button
              className={`pill-nav-btn ${currentTab === 'landing' ? 'active' : ''}`}
              onClick={() => setCurrentTab('landing')}
            >
              Overview
            </button>
          )}

          {/* DONOR ROLE: Strictly My Donor Portal ONLY */}
          {isDonor && (
            <button
              className={`pill-nav-btn ${currentTab === 'donor' ? 'active' : ''}`}
              onClick={() => setCurrentTab('donor')}
              style={{
                background: '#e11d48',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              <Users size={14} />
              My Donor Portal
            </button>
          )}

          {/* HOSPITAL ROLE */}
          {isHospital && (
            <>
              <button
                className={`pill-nav-btn ${currentTab === 'hospital' ? 'active' : ''}`}
                onClick={() => setCurrentTab('hospital')}
              >
                <Building2 size={14} />
                Hospital Triage
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'command' ? 'active' : ''}`}
                onClick={() => setCurrentTab('command')}
              >
                <Activity size={14} />
                Command
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'tracking' ? 'active' : ''}`}
                onClick={() => setCurrentTab('tracking')}
                style={{
                  color: currentTab === 'tracking' ? '#ffffff' : '#38bdf8',
                  background: currentTab === 'tracking' ? '#0284c7' : 'rgba(14, 165, 233, 0.1)',
                  fontWeight: 700,
                }}
              >
                <Navigation size={14} />
                Live Tracking
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setCurrentTab('whatsapp')}
                style={{
                  color: currentTab === 'whatsapp' ? '#ffffff' : '#15803d',
                  background: currentTab === 'whatsapp' ? '#16a34a' : 'rgba(34, 197, 94, 0.1)',
                  fontWeight: 700,
                }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'genetic' ? 'active' : ''}`}
                onClick={() => setCurrentTab('genetic')}
              >
                <Dna size={14} />
                Genetic Risk
              </button>
              {userRole === 'HOSPITAL_ADMIN' && (
                <button
                  className={`pill-nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('admin')}
                >
                  <Shield size={14} />
                  Audit
                </button>
              )}
            </>
          )}

          {/* BLOOD CENTRE ROLE */}
          {isBloodCentre && (
            <>
              <button
                className={`pill-nav-btn ${currentTab === 'bloodcentre' ? 'active' : ''}`}
                onClick={() => setCurrentTab('bloodcentre')}
              >
                <Droplet size={14} />
                Blood Centre
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'command' ? 'active' : ''}`}
                onClick={() => setCurrentTab('command')}
              >
                <Activity size={14} />
                Command
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'tracking' ? 'active' : ''}`}
                onClick={() => setCurrentTab('tracking')}
                style={{
                  color: currentTab === 'tracking' ? '#ffffff' : '#38bdf8',
                  background: currentTab === 'tracking' ? '#0284c7' : 'rgba(14, 165, 233, 0.1)',
                  fontWeight: 700,
                }}
              >
                <Navigation size={14} />
                Live Tracking
              </button>
              {userRole === 'BLOOD_CENTRE_ADMIN' && (
                <button
                  className={`pill-nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('admin')}
                >
                  <Shield size={14} />
                  Audit
                </button>
              )}
            </>
          )}

          {/* AUDITOR / SUPER ADMIN ROLE */}
          {isAuditorOrAdmin && (
            <>
              <button
                className={`pill-nav-btn ${currentTab === 'command' ? 'active' : ''}`}
                onClick={() => setCurrentTab('command')}
              >
                <Activity size={14} />
                Command
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentTab('admin')}
              >
                <Shield size={14} />
                Audit &amp; Logs
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'hospital' ? 'active' : ''}`}
                onClick={() => setCurrentTab('hospital')}
              >
                <Building2 size={14} />
                Hospital
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'bloodcentre' ? 'active' : ''}`}
                onClick={() => setCurrentTab('bloodcentre')}
              >
                <Droplet size={14} />
                Blood Centre
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'tracking' ? 'active' : ''}`}
                onClick={() => setCurrentTab('tracking')}
              >
                <Navigation size={14} />
                Live Tracking
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setCurrentTab('whatsapp')}
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
              <button
                className={`pill-nav-btn ${currentTab === 'genetic' ? 'active' : ''}`}
                onClick={() => setCurrentTab('genetic')}
              >
                <Dna size={14} />
                Genetic Risk
              </button>
            </>
          )}
        </nav>

        {/* Right: Auth, User Profile & Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {currentUserProfile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#f1f5f9',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '9999px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <UserCheck size={13} color="#0284c7" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                  {currentUserProfile.full_name.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    background: '#e2e8f0',
                    color: '#475569',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                  }}
                >
                  {currentUserProfile.role.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out of your account"
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  borderRadius: '9999px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <LogOut size={12} /> Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.38rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Lock size={12} /> Sign In
            </button>
          )}

          {/* Notification Bell */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#334155',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#e11d48',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: '15px',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: '340px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)',
                  zIndex: 200,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>Live System Alerts</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                    }}
                  >
                    REALTIME
                  </span>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No incoming notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid #f8fafc',
                          background: n.read ? '#ffffff' : '#f0f9ff',
                          cursor: 'pointer',
                        }}
                        onClick={() => RealBackendService.markNotificationRead(n.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{n.title}</strong>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer Sheet */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fadeIn">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {/* GUEST: Overview */}
            {!currentUserProfile && (
              <button
                className={`mobile-nav-item ${currentTab === 'landing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab('landing');
                  setMobileMenuOpen(false);
                }}
              >
                <Droplet size={16} />
                <span>Overview &amp; Role Portal</span>
              </button>
            )}

            {/* DONOR ROLE: Strictly My Donor Portal ONLY */}
            {isDonor && (
              <button
                className={`mobile-nav-item ${currentTab === 'donor' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab('donor');
                  setMobileMenuOpen(false);
                }}
                style={{
                  background: currentTab === 'donor' ? '#e11d48' : '#fff1f2',
                  color: currentTab === 'donor' ? '#ffffff' : '#e11d48',
                  fontWeight: 800,
                }}
              >
                <Users size={16} />
                <span>My Donor Portal</span>
              </button>
            )}

            {/* HOSPITAL ROLE */}
            {isHospital && (
              <>
                <button
                  className={`mobile-nav-item ${currentTab === 'hospital' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('hospital');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Building2 size={16} />
                  <span>Hospital Triage</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'command' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('command');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Activity size={16} />
                  <span>Command Centre</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'tracking' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('tracking');
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: currentTab === 'tracking' ? '#0284c7' : 'rgba(14, 165, 233, 0.08)',
                    color: currentTab === 'tracking' ? '#ffffff' : '#0284c7',
                  }}
                >
                  <Navigation size={16} />
                  <span>Live Tracking Map</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('whatsapp');
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: currentTab === 'whatsapp' ? '#16a34a' : 'rgba(34, 197, 94, 0.1)',
                    color: currentTab === 'whatsapp' ? '#ffffff' : '#15803d',
                  }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Dispatcher</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'genetic' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('genetic');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Dna size={16} />
                  <span>Genetic Risk Calculator</span>
                </button>
                {userRole === 'HOSPITAL_ADMIN' && (
                  <button
                    className={`mobile-nav-item ${currentTab === 'admin' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentTab('admin');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Shield size={16} />
                    <span>Compliance &amp; Audit</span>
                  </button>
                )}
              </>
            )}

            {/* BLOOD CENTRE ROLE */}
            {isBloodCentre && (
              <>
                <button
                  className={`mobile-nav-item ${currentTab === 'bloodcentre' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('bloodcentre');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Droplet size={16} />
                  <span>Blood Centre Inventory</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'command' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('command');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Activity size={16} />
                  <span>Command Centre</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'tracking' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('tracking');
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: currentTab === 'tracking' ? '#0284c7' : 'rgba(14, 165, 233, 0.08)',
                    color: currentTab === 'tracking' ? '#ffffff' : '#0284c7',
                  }}
                >
                  <Navigation size={16} />
                  <span>Live Tracking Map</span>
                </button>
                {userRole === 'BLOOD_CENTRE_ADMIN' && (
                  <button
                    className={`mobile-nav-item ${currentTab === 'admin' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentTab('admin');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Shield size={16} />
                    <span>Compliance &amp; Audit</span>
                  </button>
                )}
              </>
            )}

            {/* AUDITOR / SUPER ADMIN ROLE */}
            {isAuditorOrAdmin && (
              <>
                <button
                  className={`mobile-nav-item ${currentTab === 'command' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('command');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Activity size={16} />
                  <span>Command Centre</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'admin' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('admin');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Shield size={16} />
                  <span>Compliance &amp; Audit</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'hospital' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('hospital');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Building2 size={16} />
                  <span>Hospital Triage</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'bloodcentre' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('bloodcentre');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Droplet size={16} />
                  <span>Blood Centre Inventory</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'tracking' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('tracking');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Navigation size={16} />
                  <span>Live Tracking Map</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('whatsapp');
                    setMobileMenuOpen(false);
                  }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Dispatcher</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentTab === 'genetic' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab('genetic');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Dna size={16} />
                  <span>Genetic Risk Calculator</span>
                </button>
              </>
            )}

            {/* Quick Mobile Auth Button */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
              {currentUserProfile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      {currentUserProfile.full_name} ({currentUserProfile.role.replace('_', ' ')})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    style={{ background: '#fee2e2', color: '#dc2626', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Lock size={14} />
                  <span>Sign In / Switch Role</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
