import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Droplet,
  Heart,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { BloodRequest, DonorJourney, Profile } from '../types';
import { LiveDonorTrackingMap } from './LiveDonorTrackingMap';

interface DonorDashboardProps {
  currentUserProfile: Profile | null;
  onOpenAuth: () => void;
  requests: BloodRequest[];
  onRefreshData: () => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  currentUserProfile,
  onOpenAuth,
  requests,
  onRefreshData,
}) => {
  const [donorActiveSubTab, setDonorActiveSubTab] = useState<'requests' | 'tracking' | 'guidelines'>('requests');
  const [donorJourneys, setDonorJourneys] = useState<DonorJourney[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    RealBackendService.getDonorJourneys().then((j) => {
      setDonorJourneys(j);
      setLoading(false);
    });
  }, [currentUserProfile?.id]);

  const handleRespond = async (journeyId: string, response: 'ACCEPT' | 'DECLINE') => {
    const res = await RealBackendService.recordDonorResponse(journeyId, response);
    if (res.success && res.notice) {
      setFeedbackNotice(res.notice);
      const refreshed = await RealBackendService.getDonorJourneys();
      setDonorJourneys(refreshed);
      onRefreshData();
    }
  };

  const handleAdvanceStep = async (journeyId: string, nextStage: any) => {
    await RealBackendService.updateDonorJourneyStage(journeyId, nextStage);
    const refreshed = await RealBackendService.getDonorJourneys();
    setDonorJourneys(refreshed);
    onRefreshData();
  };

  const donorBloodGroup = (currentUserProfile as any)?.blood_group || 'O+';

  return (
    <div style={{ maxWidth: donorActiveSubTab === 'tracking' ? '1400px' : '960px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
      {/* Donor Profile & Role Isolation Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #ffffff 100%)',
          border: '1px solid #fecdd3',
          borderRadius: '20px',
          padding: '1.5rem 1.75rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px rgba(225, 29, 72, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
            }}
          >
            {donorBloodGroup}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {currentUserProfile?.full_name || 'Verified Donor'}
              </h2>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ShieldCheck size={12} /> VERIFIED DONOR
              </span>
              <span
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                }}
              >
                ROLE ISOLATED
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>Blood Group: <strong style={{ color: '#e11d48' }}>{donorBloodGroup}</strong></span>
              <span>&bull;</span>
              <span>City: <strong>Mysuru, Karnataka</strong></span>
              <span>&bull;</span>
              <span>Status: <strong style={{ color: '#16a34a' }}>Ready for Mobilization</strong></span>
            </div>
          </div>
        </div>

        {/* Sub-View Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#ffffff',
            padding: '0.3rem',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            gap: '0.25rem',
          }}
        >
          <button
            onClick={() => setDonorActiveSubTab('requests')}
            style={{
              background: donorActiveSubTab === 'requests' ? '#e11d48' : 'transparent',
              color: donorActiveSubTab === 'requests' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.45rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Activity size={13} /> Mobilization &amp; Alerts
          </button>
          <button
            onClick={() => setDonorActiveSubTab('tracking')}
            style={{
              background: donorActiveSubTab === 'tracking' ? '#0284c7' : 'transparent',
              color: donorActiveSubTab === 'tracking' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.45rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Navigation size={13} /> Hospital Transit Map
          </button>
          <button
            onClick={() => setDonorActiveSubTab('guidelines')}
            style={{
              background: donorActiveSubTab === 'guidelines' ? '#0f172a' : 'transparent',
              color: donorActiveSubTab === 'guidelines' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.45rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Info size={13} /> Guidelines
          </button>
        </div>
      </div>

      {/* VIEW 1: Live Hospital Transit Map */}
      {donorActiveSubTab === 'tracking' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '0.85rem 1.25rem',
              color: '#ffffff',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Navigation size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                Simulated Donor Journey: Kuvempunagar &rarr; JSS Hospital, Mysuru
              </span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
              }}
            >
              DONOR PERSPECTIVE
            </span>
          </div>

          <LiveDonorTrackingMap />
        </div>
      )}

      {/* VIEW 2: Clinical Guidelines */}
      {donorActiveSubTab === 'guidelines' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#16a34a" /> Donor Clinical Eligibility &amp; Safety Protocols
          </h3>
          <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            RAKTSETU enforces strict clinical safeguards under statutory guidelines. All donors must meet baseline parameters before clinical clearance at hospital triage.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>Age &amp; Weight Limits</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Age 18 - 65 years. Minimum body weight 45 kg (for 350 mL) or 50 kg (for 450 mL whole blood).</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>Hemoglobin Baseline</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Minimum hemoglobin level of 12.5 g/dL confirmed via on-site pre-donation fingerprick screening.</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>Donation Interval</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Whole blood: 90 days for males, 120 days for females. Platelet apheresis: 48 hours minimum.</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Mobilization & Active Journeys */}
      {donorActiveSubTab === 'requests' && (
        <>
          {/* Mandatory Clinical Safety Boundary Banner (Section 22 & 31) */}
          <div className="notice-box" style={{ marginBottom: '1.5rem', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
            <Info size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>Clinical Safety Principle:</strong>
              <p style={{ marginTop: '0.2rem', lineHeight: 1.4, color: '#334155' }}>
                RAKTSETU coordinates emergency mobilization but does not replace medical judgment. A donor response does not guarantee donation eligibility or secured blood. All donors must undergo mandatory on-site clinical screening by licensed healthcare personnel at the hospital triage.
              </p>
            </div>
          </div>

      {/* Response Feedback Notice */}
      {feedbackNotice && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #d97706',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#b45309',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <CheckCircle2 size={16} color="#d97706" /> Response Recorded in Database
          </div>
          <p style={{ marginTop: '0.35rem', lineHeight: 1.4 }}>
            {feedbackNotice}
          </p>
        </div>
      )}

      {/* Active Journeys in Supabase */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={18} color="var(--blood-red)" />
        Active Emergency Coordination Journeys
      </h3>

      {donorJourneys.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          No active emergency journeys currently dispatched for your profile in the database.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {donorJourneys.map((j) => {
            const isAlerted = j.status === 'ALERTED';
            const isResponded = j.status === 'RESPONDED';
            const isOnTheWay = j.status === 'ON_THE_WAY';
            const isArrived = j.status === 'ARRIVED';
            const isCleared = j.status === 'SCREENING_CLEARED';
            const isConfirmed = j.status === 'DONATION_CONFIRMED';
            const isFailed = j.status === 'SCREENING_FAILED';

            return (
              <div
                key={j.id}
                style={{
                  background: 'var(--bg-card)',
                  border: isConfirmed ? '1px solid var(--secured-border)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="blood-group-tag">{j.blood_group || 'Blood Need'}</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Emergency Request #{j.request_id.substring(0, 8)}
                      </h4>
                    </div>
                  </div>

                  <span className="badge badge-open">STATUS: {j.status}</span>
                </div>

                {/* Stepper tracker */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0.5rem',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ opacity: isAlerted || isResponded || isOnTheWay || isArrived || isCleared || isConfirmed ? 1 : 0.4 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STEP 1</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Alerted</div>
                  </div>
                  <div style={{ opacity: isResponded || isOnTheWay || isArrived || isCleared || isConfirmed ? 1 : 0.4 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STEP 2</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>Responded</div>
                  </div>
                  <div style={{ opacity: isOnTheWay || isArrived || isCleared || isConfirmed ? 1 : 0.4 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STEP 3</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--amber-outstanding)' }}>Transit</div>
                  </div>
                  <div style={{ opacity: isArrived || isCleared || isConfirmed ? 1 : 0.4 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STEP 4</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a855f7' }}>Screening</div>
                  </div>
                  <div style={{ opacity: isConfirmed ? 1 : 0.4 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STEP 5</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secured-green)' }}>Secured</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {isAlerted && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRespond(j.id, 'ACCEPT')}
                      >
                        <Heart size={16} /> I CAN HELP
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleRespond(j.id, 'DECLINE')}
                      >
                        <XCircle size={16} /> NOT AVAILABLE
                      </button>
                    </>
                  )}

                  {isResponded && (
                    <button
                      className="btn btn-amber btn-sm"
                      onClick={() => handleAdvanceStep(j.id, 'ON_THE_WAY')}
                    >
                      <Navigation size={14} /> I am On My Way
                    </button>
                  )}

                  {isOnTheWay && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAdvanceStep(j.id, 'ARRIVED')}
                    >
                      <MapPin size={14} /> I Have Arrived at Facility
                    </button>
                  )}

                  {isArrived && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--amber-outstanding)' }}>
                      Reporting for authorized clinical screening...
                    </span>
                  )}

                  {isCleared && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--secured-green)', fontWeight: 700 }}>
                      Screening cleared! Clinical collection underway.
                    </span>
                  )}

                  {isConfirmed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secured-green)', fontSize: '0.85rem', fontWeight: 700 }}>
                      <CheckCircle2 size={16} />
                      Donation Confirmed & Secured in Database! Thank you for saving a life.
                    </div>
                  )}

                  {isFailed && (
                    <div style={{ color: '#f87171', fontSize: '0.8rem' }}>
                      <strong>Screening Disqualification:</strong> {j.failure_reason}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}
</div>
);
};
