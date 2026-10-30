import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { AdminAuditorDashboard } from './components/AdminAuditorDashboard';
import { AuthModal } from './components/AuthModal';
import { BloodCentreDashboard } from './components/BloodCentreDashboard';
import { DonorDashboard } from './components/DonorDashboard';
import { FulfilmentCommandCentre } from './components/FulfilmentCommandCentre';
import { GeneticRiskCalculator } from './components/GeneticRiskCalculator';
import { HospitalDashboard } from './components/HospitalDashboard';
import { LandingPage } from './components/LandingPage';
import { LiveDonorTrackingMap } from './components/LiveDonorTrackingMap';
import { Navbar } from './components/Navbar';
import { WhatsAppDispatcher } from './components/WhatsAppDispatcher';
import { RealBackendService } from './services/realBackend';
import { supabase } from './services/supabaseClient';
import { AuditLog, BloodRequest, NotificationItem, Profile } from './types';

const AccessBoundary: React.FC<{
  requiredRoleText: string;
  userRole?: string;
  userName?: string;
  onOpenAuth: () => void;
  onReturnHome: () => void;
}> = ({ requiredRoleText, userRole, userName, onOpenAuth, onReturnHome }) => (
  <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 1.25rem' }}>
      <Lock size={26} />
    </div>
    <span className="badge badge-critical" style={{ marginBottom: '0.75rem' }}>
      RBAC Healthcare Boundary
    </span>
    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.4rem' }}>
      Restricted Clinical Portal
    </h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.75rem 0 1.75rem', lineHeight: 1.6 }}>
      You are currently signed in as <strong>{userName} ({userRole})</strong>.
      <br />
      This dashboard is restricted to <strong>{requiredRoleText}</strong>.
    </p>
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button className="btn btn-secondary" onClick={onReturnHome}>
        Return to Overview
      </button>
      <button className="btn btn-primary" onClick={onOpenAuth}>
        Switch Account / Role
      </button>
    </div>
  </div>
);

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const refreshAllData = async () => {
    try {
      const session = await RealBackendService.getCurrentUserSession();
      setCurrentUserProfile(session?.profile || null);

      const reqs = await RealBackendService.getRequests();
      setRequests(reqs);
      if (reqs.length > 0 && !selectedRequestId) {
        setSelectedRequestId(reqs[0].id);
      }

      const logs = await RealBackendService.getAuditLogs();
      setAuditLogs(logs);

      if (session?.user) {
        const notifs = await RealBackendService.getNotificationsForUser(session.user.id);
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.warn('Backend refresh error (tables may still be deploying in Supabase):', e);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Listen to real Supabase Auth session changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userSession = await RealBackendService.getCurrentUserSession();
        setCurrentUserProfile(userSession?.profile || null);
      } else {
        setCurrentUserProfile(null);
      }
      refreshAllData();
    });

    // Subscribe to live Supabase Realtime WebSocket changes
    const unsubscribeRealtime = RealBackendService.subscribeToRealtimeChanges(() => {
      refreshAllData();
    });

    const handleCustomAuth = () => {
      refreshAllData();
    };
    window.addEventListener('raktsetu_auth_change', handleCustomAuth);

    return () => {
      authListener.subscription.unsubscribe();
      unsubscribeRealtime();
      window.removeEventListener('raktsetu_auth_change', handleCustomAuth);
    };
  }, []);

  const ROLE_ALLOWED_TABS: Record<string, string[]> = {
    DONOR: ['donor'],
    HOSPITAL_COORDINATOR: ['hospital', 'command', 'tracking', 'whatsapp', 'genetic'],
    HOSPITAL_ADMIN: ['hospital', 'command', 'tracking', 'whatsapp', 'genetic', 'admin'],
    BLOOD_CENTRE_OPERATOR: ['bloodcentre', 'command', 'tracking'],
    BLOOD_CENTRE_ADMIN: ['bloodcentre', 'command', 'tracking', 'admin'],
    AUDITOR: ['command', 'admin', 'hospital', 'bloodcentre', 'tracking', 'whatsapp', 'genetic'],
    SUPER_ADMIN: ['command', 'admin', 'hospital', 'bloodcentre', 'donor', 'tracking', 'whatsapp', 'genetic'],
  };

  const navigateToRoleDashboard = (profile: Profile | null) => {
    if (!profile) {
      setCurrentTab('landing');
      return;
    }
    const role = profile.role;
    if (role === 'DONOR') {
      setCurrentTab('donor');
    } else if (role === 'HOSPITAL_COORDINATOR' || role === 'HOSPITAL_ADMIN') {
      setCurrentTab('hospital');
    } else if (role === 'BLOOD_CENTRE_OPERATOR' || role === 'BLOOD_CENTRE_ADMIN') {
      setCurrentTab('bloodcentre');
    } else if (role === 'AUDITOR' || role === 'SUPER_ADMIN') {
      setCurrentTab('command');
    } else {
      setCurrentTab('donor');
    }
  };

  // Strict Role Route Guard: Automatically redirect user to their authorized dashboard
  useEffect(() => {
    const role = currentUserProfile?.role;
    if (role) {
      const allowed = ROLE_ALLOWED_TABS[role] || ['donor'];
      if (!allowed.includes(currentTab)) {
        navigateToRoleDashboard(currentUserProfile);
      }
    } else {
      // Guest is strictly restricted to the Overview role gateway
      if (currentTab !== 'landing') {
        setCurrentTab('landing');
      }
    }
  }, [currentUserProfile?.role, currentTab]);

  const handleAuthSuccess = async () => {
    await refreshAllData();
    const session = await RealBackendService.getCurrentUserSession();
    if (session?.profile) {
      setCurrentUserProfile(session.profile);
      navigateToRoleDashboard(session.profile);
    }
  };

  const handleDirectRoleLogin = async (roleType: 'COORDINATOR' | 'DONOR' | 'OPERATOR') => {
    try {
      await RealBackendService.quickRoleLogin(roleType);
      const session = await RealBackendService.getCurrentUserSession();
      if (session?.profile) {
        setCurrentUserProfile(session.profile);
        navigateToRoleDashboard(session.profile);
      }
      refreshAllData();
    } catch (err) {
      console.error('Role login error:', err);
      setIsAuthModalOpen(true);
    }
  };

  const userRole = currentUserProfile?.role;
  const canAccessHospital = ['HOSPITAL_COORDINATOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole || '');
  const canAccessDonor = ['DONOR', 'SUPER_ADMIN'].includes(userRole || '');
  const canAccessBloodCentre = ['BLOOD_CENTRE_OPERATOR', 'BLOOD_CENTRE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole || '');
  const canAccessAdmin = ['AUDITOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BLOOD_CENTRE_ADMIN'].includes(userRole || '');
  const canAccessCommand = ['HOSPITAL_COORDINATOR', 'HOSPITAL_ADMIN', 'BLOOD_CENTRE_OPERATOR', 'BLOOD_CENTRE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole || '');
  const canAccessTracking = ['HOSPITAL_COORDINATOR', 'HOSPITAL_ADMIN', 'BLOOD_CENTRE_OPERATOR', 'BLOOD_CENTRE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole || '');
  const canAccessWhatsApp = ['HOSPITAL_COORDINATOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole || '');
  const canAccessGenetic = ['HOSPITAL_COORDINATOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole || '');

  return (
    <div className="app-container">
      {/* Real Top Navigation & Backend Status */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUserProfile={currentUserProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onRefreshData={refreshAllData}
        notifications={notifications}
      />

      {/* Main Realtime Operational Views */}
      <main className="main-content">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onRoleLogin={handleDirectRoleLogin}
            isLoggedIn={!!currentUserProfile}
            currentUserProfile={currentUserProfile}
          />
        )}

        {currentTab === 'command' && (
          canAccessCommand ? (
            <FulfilmentCommandCentre
              requests={requests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(id) => setSelectedRequestId(id)}
              currentUserProfile={currentUserProfile}
              onRefreshData={refreshAllData}
              auditLogs={auditLogs}
            />
          ) : (
            <AccessBoundary
              requiredRoleText="Clinical Coordinators, Blood Centre Operators & Command Staff"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => navigateToRoleDashboard(currentUserProfile)}
            />
          )
        )}

        {currentTab === 'tracking' && (
          canAccessTracking ? (
            <LiveDonorTrackingMap />
          ) : (
            <AccessBoundary
              requiredRoleText="Authorized Healthcare & Logistics Personnel"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => navigateToRoleDashboard(currentUserProfile)}
            />
          )
        )}

        {currentTab === 'hospital' && (
          canAccessHospital ? (
            <HospitalDashboard
              requests={requests}
              onSelectRequest={(id) => setSelectedRequestId(id)}
              onNavigateToCommand={() => setCurrentTab('command')}
              currentUserProfile={currentUserProfile}
              onRefreshData={refreshAllData}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          ) : (
            <AccessBoundary
              requiredRoleText="Hospital Coordinators & Emergency Clinical Triage Doctors"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => setCurrentTab('landing')}
            />
          )
        )}

        {currentTab === 'donor' && (
          canAccessDonor ? (
            <DonorDashboard
              currentUserProfile={currentUserProfile}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              requests={requests}
              onRefreshData={refreshAllData}
            />
          ) : (
            <AccessBoundary
              requiredRoleText="Verified Blood Donors & Healthcare Coordinators"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => setCurrentTab('landing')}
            />
          )
        )}

        {currentTab === 'bloodcentre' && (
          canAccessBloodCentre ? (
            <BloodCentreDashboard
              currentUserProfile={currentUserProfile}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              requests={requests}
              onRefreshData={refreshAllData}
            />
          ) : (
            <AccessBoundary
              requiredRoleText="Licensed Blood Centre Operators & Bank Inventory Technicians"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => setCurrentTab('landing')}
            />
          )
        )}

        {currentTab === 'whatsapp' && (
          canAccessWhatsApp ? (
            <WhatsAppDispatcher
              requests={requests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(id) => setSelectedRequestId(id)}
            />
          ) : (
            <AccessBoundary
              requiredRoleText="Hospital Coordinators & Authorized Healthcare Staff"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => navigateToRoleDashboard(currentUserProfile)}
            />
          )
        )}

        {currentTab === 'genetic' && (
          canAccessGenetic ? (
            <GeneticRiskCalculator />
          ) : (
            <AccessBoundary
              requiredRoleText="Clinical Geneticists & Hospital Triage Doctors"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => navigateToRoleDashboard(currentUserProfile)}
            />
          )
        )}

        {currentTab === 'admin' && (
          canAccessAdmin ? (
            <AdminAuditorDashboard
              currentUserProfile={currentUserProfile}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              auditLogs={auditLogs}
              onRefreshData={refreshAllData}
            />
          ) : (
            <AccessBoundary
              requiredRoleText="Healthcare Compliance Auditors & System Administrators"
              userRole={userRole}
              userName={currentUserProfile?.full_name}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onReturnHome={() => setCurrentTab('landing')}
            />
          )
        )}
      </main>

      {/* Real Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
