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
  Info,
  Lock,
  MapPin,
  Navigation,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { BloodRequest, DonorJourney, Profile } from '../types';

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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Donor Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Registered Donor Hub
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Emergency Donor Mobilization
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {currentUserProfile ? (
            <span className="badge badge-secured">
              <ShieldCheck size={13} />
              Verified Profile: {currentUserProfile.full_name}
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <Lock size={13} /> Sign In as Donor
            </button>
          )}
        </div>
      </div>

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
    </div>
  );
};
