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

    return () => {
      authListener.subscription.unsubscribe();
      unsubscribeRealtime();
    };
  }, []);

  const navigateToRoleDashboard = (profile: Profile | null) => {
    if (!profile) return;
    const role = profile.role;
    if (role === 'HOSPITAL_COORDINATOR' || role === 'HOSPITAL_ADMIN') {
      setCurrentTab('hospital');
    } else if (role === 'DONOR') {
      setCurrentTab('donor');
    } else if (role === 'BLOOD_CENTRE_OPERATOR' || role === 'BLOOD_CENTRE_ADMIN') {
      setCurrentTab('bloodcentre');
    } else if (role === 'AUDITOR' || role === 'SUPER_ADMIN') {
      setCurrentTab('command');
    } else {
      setCurrentTab('command');
    }
  };

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
  const canAccessHospital = !userRole || ['HOSPITAL_COORDINATOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole);
  const canAccessDonor = !userRole || ['DONOR', 'HOSPITAL_COORDINATOR', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole);
  const canAccessBloodCentre = !userRole || ['BLOOD_CENTRE_OPERATOR', 'BLOOD_CENTRE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'].includes(userRole);
  const canAccessAdmin = !userRole || ['AUDITOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(userRole);

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
          <FulfilmentCommandCentre
            requests={requests}
            selectedRequestId={selectedRequestId}
            onSelectRequest={(id) => setSelectedRequestId(id)}
            currentUserProfile={currentUserProfile}
            onRefreshData={refreshAllData}
            auditLogs={auditLogs}
          />
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
          <WhatsAppDispatcher
            requests={requests}
            selectedRequestId={selectedRequestId}
            onSelectRequest={(id) => setSelectedRequestId(id)}
          />
        )}

        {currentTab === 'genetic' && (
          <GeneticRiskCalculator />
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
