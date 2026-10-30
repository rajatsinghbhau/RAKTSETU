import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FastForward,
  Heart,
  HelpCircle,
  Info,
  MapPin,
  Navigation,
  Pause,
  Play,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Truck,
  User,
  Users,
  XCircle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
}

interface SimulatedDonor {
  id: string;
  name: string;
  bloodGroup: string;
  phone: string;
  startingLocationName: string;
  startCoords: RoutePoint;
  route: RoutePoint[];
  distanceKm: number;
  isBackup?: boolean;
}

// Tactical coordinate bounds for Mysuru Urban Sector
const MAP_BOUNDS = {
  latMin: 12.2840,
  latMax: 12.3160,
  lngMin: 76.6200,
  lngMax: 76.6640,
};

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 520;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * CANVAS_WIDTH;
  const y = ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * CANVAS_HEIGHT;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// Primary Route: Kuvempunagar -> JSS Hospital Emergency Trauma Centre
const PRIMARY_ROUTE: RoutePoint[] = [
  { lat: 12.2885, lng: 76.6265, label: 'Kuvempunagar Residential Block (Start)' },
  { lat: 12.2895, lng: 76.6305, label: 'Kuvempunagar Complex' },
  { lat: 12.2910, lng: 76.6350, label: 'Vishwamanava Double Rd' },
  { lat: 12.2930, lng: 76.6395, label: 'Akshaya Bhandar Circle' },
  { lat: 12.2950, lng: 76.6435, label: 'Saraswathipuram Fire Brigade' },
  { lat: 12.2965, lng: 76.6475, label: 'Ballal Circle' },
  { lat: 12.2974, lng: 76.6520, label: 'Agrahara Circle' },
  { lat: 12.2980, lng: 76.6555, label: 'MG Road Junction' },
  { lat: 12.2985, lng: 76.6580, label: 'JSS Hospital Emergency Trauma Centre (Destination)' },
];

// Backup Route: Saraswathipuram / Vijayanagar -> JSS Hospital
const BACKUP_ROUTE: RoutePoint[] = [
  { lat: 12.3120, lng: 76.6350, label: 'Saraswathipuram North / Kanti Nagar (Backup Start)' },
  { lat: 12.3080, lng: 76.6395, label: 'KSRTC Regional Depot Junction' },
  { lat: 12.3040, lng: 76.6440, label: 'Bogadi Main Rd Crossing' },
  { lat: 12.3010, lng: 76.6480, label: 'Ramaswamy Circle' },
  { lat: 12.2990, lng: 76.6530, label: 'Subbarayanakere Avenue' },
  { lat: 12.2985, lng: 76.6580, label: 'JSS Hospital Emergency Trauma Centre (Destination)' },
];

const HOSPITAL_COORDS: RoutePoint = {
  lat: 12.2985,
  lng: 76.6580,
  label: 'JSS Hospital Emergency Blood Bank',
};

function calculateRouteLength(pts: RoutePoint[]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const lat1 = pts[i].lat * (Math.PI / 180);
    const lon1 = pts[i].lng * (Math.PI / 180);
    const lat2 = pts[i + 1].lat * (Math.PI / 180);
    const lon2 = pts[i + 1].lng * (Math.PI / 180);
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
    const a =
      Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += 6371 * c;
  }
  return total;
}

export const LiveDonorTrackingMap: React.FC = () => {
  const [activeDonorIndex, setActiveDonorIndex] = useState<0 | 1>(0);
  const donors: SimulatedDonor[] = useMemo(
    () => [
      {
        id: 'DONOR-024',
        name: 'Arjun M. Rao',
        bloodGroup: 'O+',
        phone: '+91 98451 23419',
        startingLocationName: 'Kuvempunagar, Mysuru',
        startCoords: PRIMARY_ROUTE[0],
        route: PRIMARY_ROUTE,
        distanceKm: Number(calculateRouteLength(PRIMARY_ROUTE).toFixed(1)),
        isBackup: false,
      },
      {
        id: 'DONOR-089',
        name: 'Pooja Venkatesh (Backup Tier)',
        bloodGroup: 'O+',
        phone: '+91 97412 88921',
        startingLocationName: 'Saraswathipuram, Mysuru',
        startCoords: BACKUP_ROUTE[0],
        route: BACKUP_ROUTE,
        distanceKm: Number(calculateRouteLength(BACKUP_ROUTE).toFixed(1)),
        isBackup: true,
      },
    ],
    []
  );

  const currentDonor = donors[activeDonorIndex];

  // Request State
  const [requiredUnits] = useState(4);
  const [securedUnits, setSecuredUnits] = useState(0);
  const outstandingUnits = Math.max(0, requiredUnits - securedUnits);

  // Simulation controls state
  const [simStatus, setSimStatus] = useState<
    'ACCEPTED' | 'TRAVELLING' | 'PAUSED' | 'ARRIVED' | 'SCREENING' | 'SECURED' | 'CANCELLED'
  >('ACCEPTED');
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 4>(1);
  const [progressFraction, setProgressFraction] = useState(0);
  const [screeningCleared, setScreeningCleared] = useState(false);
  const [cancellationAlert, setCancellationAlert] = useState<string | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>('Just now');

  const animationFrameRef = useRef<number | null>(null);

  // Dynamic calculations
  const totalKm = currentDonor.distanceKm;
  const remainingKm = Math.max(0, totalKm * (1 - progressFraction));
  const remainingMinutes = Math.max(0, Math.ceil((remainingKm / 24) * 60));

  // Current interpolated position
  const currentPosition = useMemo((): { lat: number; lng: number; x: number; y: number; angle: number } => {
    const pts = currentDonor.route;
    if (progressFraction <= 0) {
      const p = project(pts[0].lat, pts[0].lng);
      return { lat: pts[0].lat, lng: pts[0].lng, x: p.x, y: p.y, angle: 45 };
    }
    if (progressFraction >= 1) {
      const p = project(pts[pts.length - 1].lat, pts[pts.length - 1].lng);
      return { lat: pts[pts.length - 1].lat, lng: pts[pts.length - 1].lng, x: p.x, y: p.y, angle: 0 };
    }

    const segmentCount = pts.length - 1;
    const scaled = progressFraction * segmentCount;
    const index = Math.min(Math.floor(scaled), segmentCount - 1);
    const subProgress = scaled - index;

    const p1 = pts[index];
    const p2 = pts[index + 1];
    const lat = p1.lat + (p2.lat - p1.lat) * subProgress;
    const lng = p1.lng + (p2.lng - p1.lng) * subProgress;

    const s1 = project(p1.lat, p1.lng);
    const s2 = project(p2.lat, p2.lng);
    const curScreen = project(lat, lng);

    const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x) * (180 / Math.PI);

    return { lat, lng, x: curScreen.x, y: curScreen.y, angle };
  }, [progressFraction, currentDonor.route]);

  const fullPathD = useMemo(() => {
    const pts = currentDonor.route.map((p) => project(p.lat, p.lng));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [currentDonor.route]);

  const completedPathD = useMemo(() => {
    const pts = currentDonor.route;
    const segmentCount = pts.length - 1;
    const scaled = progressFraction * segmentCount;
    const completedIndex = Math.min(Math.floor(scaled), segmentCount);

    const screenPoints = pts.slice(0, completedIndex + 1).map((p) => project(p.lat, p.lng));
    screenPoints.push({ x: currentPosition.x, y: currentPosition.y });

    return screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [currentDonor.route, progressFraction, currentPosition]);

  // Animation Loop
  useEffect(() => {
    if (simStatus !== 'TRAVELLING') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastTick = performance.now();

    const step = (now: number) => {
      const deltaSec = (now - lastTick) / 1000;
      lastTick = now;

      const speedRate = 0.033 * speedMultiplier;

      setProgressFraction((prev) => {
        const next = prev + speedRate * deltaSec;
        if (next >= 1) {
          setSimStatus('ARRIVED');
          setLastUpdateTimestamp('Just arrived at JSS Hospital');
          return 1;
        }
        return next;
      });

      setLastUpdateTimestamp(new Date().toLocaleTimeString());
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [simStatus, speedMultiplier]);

  // Handlers
  const handleStartOrResume = () => {
    if (simStatus === 'ARRIVED' || progressFraction >= 1) {
      setProgressFraction(0);
    }
    setCancellationAlert(null);
    setSimStatus('TRAVELLING');
  };

  const handlePause = () => {
    setSimStatus('PAUSED');
  };

  const handleReset = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setProgressFraction(0);
    setSimStatus('ACCEPTED');
    setScreeningCleared(false);
    setCancellationAlert(null);
    setLastUpdateTimestamp('Just now');
  };

  const handleMarkAsArrived = () => {
    setProgressFraction(1);
    setSimStatus('ARRIVED');
    setLastUpdateTimestamp('Manual arrival registered');
  };

  const handleCancelDonor = () => {
    setSimStatus('CANCELLED');
    setCancellationAlert(
      `⚠️ Supply Path Interrupted: ${currentDonor.id} (${currentDonor.name}) reported transport breakdown / unavailable. Outstanding requirement remains ${outstandingUnits} units! Activate Backup Donor.`
    );
  };

  const handleActivateBackup = () => {
    handleReset();
    setActiveDonorIndex(1);
    setCancellationAlert(null);
  };

  const handleReactivatePrimary = () => {
    handleReset();
    setActiveDonorIndex(0);
    setCancellationAlert(null);
  };

  const handlePassScreening = () => {
    setScreeningCleared(true);
    setSimStatus('SCREENING');
  };

  const handleConfirmDonation = () => {
    setSecuredUnits((prev) => Math.min(requiredUnits, prev + 1));
    setSimStatus('SECURED');
  };

  const getTimelineStep = () => {
    if (simStatus === 'SECURED') return 7;
    if (simStatus === 'SCREENING' && screeningCleared) return 6;
    if (simStatus === 'ARRIVED') return 5;
    if (simStatus === 'TRAVELLING' || simStatus === 'PAUSED') return 4;
    if (simStatus === 'ACCEPTED') return 3;
    if (simStatus === 'CANCELLED') return 3;
    return 1;
  };
  const activeTimelineStep = getTimelineStep();

  const startScreen = project(currentDonor.route[0].lat, currentDonor.route[0].lng);
  const hospitalScreen = project(HOSPITAL_COORDS.lat, HOSPITAL_COORDS.lng);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '100%' }}>
      {/* 1. COMPACT TOP HEADER & EMERGENCY LEDGER BAR */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: 'var(--radius-md, 12px)',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Left: Request Title & Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'var(--critical-bg, #fff1f2)',
              border: '1px solid var(--critical-border, #fecdd3)',
              color: 'var(--blood-red, #e11d48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={18} fill="currentColor" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#e11d48', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
                CRITICAL EMERGENCY
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e11d48', fontFamily: 'var(--font-mono)' }}>
                RAKT-REQ-1042
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>•</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                JSS Hospital Emergency Centre, Mysuru
              </span>
            </div>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.7rem', margin: 0 }}>
              Trauma ICU Bed 04 • Category: Multiple Road Fractures • Required By: 17:30 IST
            </p>
          </div>
        </div>

        {/* Right: Quantities Inline Ledger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--critical-bg, #fff1f2)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid var(--critical-border, #fecdd3)' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#9f1239', fontWeight: 800 }}>Group:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#e11d48' }}>O+ PRBC</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Req:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{requiredUnits}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--secured-bg, #f0fdf4)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid var(--secured-border, #bbf7d0)' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#166534', fontWeight: 800 }}>Secured:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#15803d', fontFamily: 'var(--font-mono)' }}>{securedUnits}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--amber-bg, #fffbeb)', padding: '0.25rem 0.75rem', borderRadius: '6px', border: '1px solid var(--amber-border, #fde68a)' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#92400e', fontWeight: 900 }}>Outstanding:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-mono)' }}>{outstandingUnits} Units</span>
          </div>
        </div>
      </div>

      {/* 2. COMPACT 7-STAGE FULFILMENT TIMELINE STEPPER RIBBON */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: 'var(--radius-md, 12px)',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.35rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          overflowX: 'auto',
        }}
      >
        {[
          { step: 1, label: '1. Request', desc: 'Deficit logged' },
          { step: 2, label: '2. Alerted', desc: 'Wave dispatched' },
          { step: 3, label: '3. Accepted', desc: 'Consent given' },
          { step: 4, label: '4. Travelling', desc: 'In transit' },
          { step: 5, label: '5. Arrived', desc: 'On premises' },
          { step: 6, label: '6. Screening', desc: 'Hb ≥ 12.5' },
          { step: 7, label: '7. Secured', desc: 'Blood banked' },
        ].map((item, idx) => {
          const isCompleted = activeTimelineStep > item.step;
          const isCurrent = activeTimelineStep === item.step;
          const isCancelled = simStatus === 'CANCELLED' && item.step === 4;

          return (
            <React.Fragment key={item.step}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.55rem',
                  borderRadius: '6px',
                  background: isCancelled
                    ? '#fff1f2'
                    : isCompleted
                    ? '#f0fdf4'
                    : isCurrent
                    ? '#f0f9ff'
                    : 'transparent',
                  border: isCancelled
                    ? '1px solid #fecdd3'
                    : isCompleted
                    ? '1px solid #bbf7d0'
                    : isCurrent
                    ? '1px solid #bae6fd'
                    : '1px solid transparent',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: '95px',
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isCancelled ? '#e11d48' : isCompleted ? '#16a34a' : isCurrent ? '#0284c7' : '#cbd5e1',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? '✓' : item.step}
                </span>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: isCancelled ? '#e11d48' : isCompleted ? '#15803d' : isCurrent ? '#0284c7' : '#64748b', lineHeight: 1.1 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#94a3b8', lineHeight: 1 }}>
                    {isCancelled ? 'Aborted' : isCurrent ? 'Active Now' : item.desc}
                  </div>
                </div>
              </div>
              {idx < 6 && (
                <div style={{ width: '8px', height: '1px', background: '#cbd5e1', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* CANCELLATION & BACKUP BANNER (IF TRIGGERED) */}
      {cancellationAlert && (
        <div
          style={{
            background: 'var(--critical-bg, #fff1f2)',
            border: '1.5px solid var(--critical-border, #fecdd3)',
            borderRadius: '10px',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9f1239', fontSize: '0.8rem', fontWeight: 700 }}>
            <AlertOctagon size={18} color="#e11d48" />
            <span>{cancellationAlert}</span>
          </div>
          {activeDonorIndex === 0 && (
            <button
              onClick={handleActivateBackup}
              style={{
                background: '#d97706',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.75rem',
                border: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
              }}
            >
              <Users size={14} />
              Activate Backup Donor (DONOR-089)
            </button>
          )}
        </div>
      )}

      {/* 3. MAIN WORKSPACE: MAP (LEFT) + TELEMETRY & CLINICAL CARD (RIGHT) */}
      <div className="live-tracking-grid">
        {/* LEFT COLUMN: TACTICAL MAP & OPERATIONAL CONTROLS */}
        <div
          className="live-tracking-map-col"
          style={{
            background: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-md, 14px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Top Floating Telemetry & Speed Bar */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'none',
            }}
          >
            {/* Status Pill */}
            <div
              style={{
                pointerEvents: 'auto',
                background: 'rgba(9, 13, 22, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '4px 10px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: simStatus === 'TRAVELLING' ? '#10b981' : simStatus === 'CANCELLED' ? '#ef4444' : '#f59e0b',
                  boxShadow: simStatus === 'TRAVELLING' ? '0 0 8px #10b981' : 'none',
                }}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>
                {simStatus === 'TRAVELLING'
                  ? `${currentDonor.id} IN TRANSIT`
                  : simStatus === 'ARRIVED'
                  ? 'ON PREMISES: JSS HOSPITAL'
                  : simStatus === 'CANCELLED'
                  ? 'TRANSIT ABORTED'
                  : 'DISPATCH STANDBY'}
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#38bdf8', padding: '1px 5px', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '4px' }}>
                SIMULATED GPS
              </span>
            </div>

            {/* Speed Pills */}
            <div
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(9, 13, 22, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '3px',
                borderRadius: '8px',
              }}
            >
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  style={{
                    background: speedMultiplier === spd ? '#0284c7' : 'transparent',
                    color: speedMultiplier === spd ? '#fff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '3px 7px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* SVG Vector Map Canvas */}
          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <svg
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                background: '#070a13',
              }}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0ea5e9" floodOpacity="0.8" />
                </filter>
                <filter id="vehicleGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.9" />
                </filter>
                <filter id="hospitalGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.8" />
                </filter>
                <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Grid */}
              <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#tacticalGrid)" />

              {/* Kukkarahalli Lake */}
              <path
                d="M 280,35 Q 340,25 380,55 T 360,105 T 300,115 T 260,75 Z"
                fill="rgba(14, 165, 233, 0.08)"
                stroke="rgba(14, 165, 233, 0.2)"
                strokeWidth="1.5"
              />
              <text x="290" y="75" fill="rgba(14, 165, 233, 0.4)" fontSize="9" fontWeight="700">
                KUKKARAHALLI LAKE
              </text>

              {/* City Sectors */}
              <rect x="60" y="390" width="180" height="95" rx="8" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.04)" />
              <text x="75" y="445" fill="rgba(255,255,255,0.22)" fontSize="10" fontWeight="800">
                KUVEMPUNAGAR SECTOR
              </text>

              <rect x="240" y="130" width="220" height="170" rx="8" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.04)" />
              <text x="255" y="215" fill="rgba(255,255,255,0.22)" fontSize="10" fontWeight="800">
                SARASWATHIPURAM
              </text>

              <rect x="520" y="225" width="180" height="135" rx="8" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.04)" />
              <text x="535" y="295" fill="rgba(255,255,255,0.22)" fontSize="10" fontWeight="800">
                CHAMARAJAPURAM
              </text>

              <rect x="760" y="205" width="210" height="170" rx="12" fill="rgba(239, 68, 68, 0.04)" stroke="rgba(239, 68, 68, 0.15)" />
              <text x="775" y="245" fill="rgba(239, 68, 68, 0.4)" fontSize="10" fontWeight="900">
                HEALTHCARE COMPLEX ZONE
              </text>

              {/* Arterial Roads */}
              <g stroke="rgba(255, 255, 255, 0.12)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 20,495 Q 300,505 600,485 T 980,450" />
                <path d="M 30,175 L 320,165 L 640,175 L 980,165" />
                <path d="M 140,475 L 360,345 L 630,205" />
                <path d="M 640,175 L 730,250 L 870,280 L 980,290" />
                <path d="M 480,175 L 580,240 L 680,310 L 870,280" />
              </g>

              {/* Planned Route Line */}
              <path
                d={fullPathD}
                fill="none"
                stroke="#475569"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8, 6"
                opacity="0.8"
              />

              {/* Traversed Completed Line */}
              <path
                d={completedPathD}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeGlow)"
              />

              {/* Start Location Node */}
              <g transform={`translate(${startScreen.x}, ${startScreen.y})`}>
                <circle r="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <circle r="5" fill="#38bdf8" />
                <rect x="-80" y="-32" width="160" height="22" rx="11" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="0" y="-17" fill="#38bdf8" fontSize="9" fontWeight="800" textAnchor="middle">
                  {currentDonor.isBackup ? 'BACKUP (SARASWATHIPURAM)' : 'ORIGIN (KUVEMPUNAGAR)'}
                </text>
              </g>

              {/* Hospital Destination Node */}
              <g transform={`translate(${hospitalScreen.x}, ${hospitalScreen.y})`}>
                <circle r="32" fill="rgba(239, 68, 68, 0.15)" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" />
                <circle r="20" fill="rgba(239, 68, 68, 0.3)" />
                <circle r="13" fill="#ef4444" filter="url(#hospitalGlow)" />
                <path d="M -2,-7 L 2,-7 L 2,-2 L 7,-2 L 7,2 L 2,2 L 2,7 L -2,7 L -2,2 L -7,2 L -7,-2 L -2,-2 Z" fill="#ffffff" />
                <rect x="-90" y="-36" width="180" height="24" rx="12" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.8" />
                <text x="0" y="-20" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                  JSS HOSPITAL TRAUMA CENTRE
                </text>
              </g>

              {/* Moving Vehicle Marker */}
              <g transform={`translate(${currentPosition.x}, ${currentPosition.y})`} filter="url(#vehicleGlow)">
                <circle r="22" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6">
                  <animate attributeName="r" values="14;34" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle r="16" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="4" fontSize="12" textAnchor="middle" fill="#ffffff">
                  🚗
                </text>
                <rect x="-38" y="-30" width="76" height="16" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="-18" fill="#38bdf8" fontSize="9" fontWeight="900" textAnchor="middle">
                  {currentDonor.id} ({currentDonor.bloodGroup})
                </text>
              </g>

              {/* Scale & Compass */}
              <g transform="translate(35, 465)">
                <circle r="15" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <path d="M 0,-11 L 2,-2 L 0,0 Z" fill="#ef4444" />
                <text x="0" y="-14" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle">N</text>
                <line x1="30" y1="0" x2="85" y2="0" stroke="#ffffff" strokeWidth="2" />
                <text x="57" y="-5" fill="#94a3b8" fontSize="8" fontWeight="800" textAnchor="middle">1.0 KM</text>
              </g>
            </svg>
          </div>

          {/* Bottom Controls Ribbon Inside Map Card */}
          <div
            style={{
              background: 'rgba(9, 13, 22, 0.98)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '0.5rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              zIndex: 20,
            }}
          >
            {/* Play/Pause/Reset/Override */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {simStatus !== 'TRAVELLING' ? (
                <button
                  onClick={handleStartOrResume}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Play size={13} fill="currentColor" />
                  {progressFraction > 0 && progressFraction < 1 ? 'Resume' : 'Start Simulation'}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  style={{
                    background: '#f59e0b',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Pause size={13} fill="currentColor" />
                  Pause
                </button>
              )}

              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <RefreshCw size={12} />
                Reset
              </button>

              <button
                onClick={handleMarkAsArrived}
                disabled={simStatus === 'ARRIVED' || simStatus === 'SECURED'}
                style={{
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  opacity: simStatus === 'ARRIVED' ? 0.5 : 1,
                }}
              >
                Mark Arrived (Override)
              </button>
            </div>

            {/* Cancel & Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {simStatus !== 'CANCELLED' && simStatus !== 'SECURED' && (
                <button
                  onClick={handleCancelDonor}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <XCircle size={13} />
                  Simulate Cancellation
                </button>
              )}

              {activeDonorIndex === 1 && (
                <button
                  onClick={handleReactivatePrimary}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Switch Primary
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TELEMETRY & CLINICAL SCREENING PANEL */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: 'var(--radius-md, 14px)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflowY: 'auto',
          }}
        >
          {/* Donor Profile Header */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: currentDonor.isBackup ? '#fef3c7' : '#e0f2fe',
                    color: currentDonor.isBackup ? '#b45309' : '#0369a1',
                    textTransform: 'uppercase',
                  }}
                >
                  {currentDonor.isBackup ? 'Backup Tier' : 'Primary Candidate'}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)', margin: '0.2rem 0 0' }}>
                  {currentDonor.name}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-mono)' }}>
                  {currentDonor.id} • {currentDonor.phone}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  background: '#e11d48',
                  color: '#fff',
                  padding: '3px 7px',
                  borderRadius: '6px',
                }}
              >
                {currentDonor.bloodGroup}
              </span>
            </div>
          </div>

          {/* Dynamic Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.55rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Compass size={12} color="#0284c7" />
                Dist Remaining
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                {remainingKm.toFixed(1)} km
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.55rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Clock size={12} color="#d97706" />
                Est Arrival
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                ~{remainingMinutes} mins
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
              <span>Route Progress</span>
              <span style={{ color: '#0284c7', fontWeight: 800 }}>{Math.round(progressFraction * 100)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.round(progressFraction * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0284c7, #10b981)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>

          {/* Route Origin & Destination Summary */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
              <span style={{ color: '#64748b' }}>Origin:</span>
              <strong style={{ color: '#0f172a' }}>{currentDonor.startingLocationName}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e11d48' }} />
              <span style={{ color: '#64748b' }}>Hospital:</span>
              <strong style={{ color: '#0f172a' }}>JSS Hospital Emergency Trauma</strong>
            </div>
          </div>

          {/* Clinical Gate Box */}
          <div
            style={{
              background: 'var(--blue-bg, #f0f9ff)',
              border: '1px solid var(--blue-glow, #bae6fd)',
              borderRadius: '10px',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 800 }}>
              <Stethoscope size={15} />
              Hospital Triage &amp; Phlebotomy Protocol
            </div>

            <p style={{ color: '#64748b', fontSize: '0.68rem', margin: 0, lineHeight: 1.35 }}>
              <strong>Healthcare Axiom:</strong> Physical arrival does not equal usable blood. Screening and phlebotomy clearance are strictly required before secured count increases.
            </p>

            {simStatus === 'ARRIVED' && !screeningCleared && (
              <button
                onClick={handlePassScreening}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                }}
              >
                <ShieldCheck size={14} />
                Pass Clinical Screening (Hb ≥ 12.5 Cleared)
              </button>
            )}

            {screeningCleared && simStatus !== 'SECURED' && (
              <button
                onClick={handleConfirmDonation}
                style={{
                  background: '#15803d',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  padding: '0.55rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 8px rgba(22, 128, 61, 0.3)',
                  animation: 'pulse 2s infinite',
                }}
              >
                <CheckCircle2 size={15} />
                Confirm 1 Unit Secured (Phlebotomy Done)
              </button>
            )}

            {simStatus === 'SECURED' && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.4rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, textAlign: 'center' }}>
                🎉 Unit Handover Complete! Secured: {securedUnits}/{requiredUnits}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
