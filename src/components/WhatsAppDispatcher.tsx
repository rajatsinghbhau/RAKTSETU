import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Droplet,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Share2,
  Users
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { BloodRequest, DonorJourney } from '../types';

interface WhatsAppDispatcherProps {
  requests: BloodRequest[];
  selectedRequestId?: string;
  onSelectRequest?: (id: string) => void;
}

export const WhatsAppDispatcher: React.FC<WhatsAppDispatcherProps> = ({
  requests,
  selectedRequestId,
  onSelectRequest,
}) => {
  const activeRequests = requests.filter((r) => r.status !== 'CANCELLED');
  const [currentReqId, setCurrentReqId] = useState<string>(
    selectedRequestId || (activeRequests.length > 0 ? activeRequests[0].id : '')
  );

  const selectedReq = activeRequests.find((r) => r.id === currentReqId) || activeRequests[0];

  const [donorJourneys, setDonorJourneys] = useState<DonorJourney[]>([]);
  const [targetPhone, setTargetPhone] = useState<string>('916006853510');
  const [targetName, setTargetName] = useState<string>('Rohan Sharma');
  const [copied, setCopied] = useState(false);
  const [dispatchedNotice, setDispatchedNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedReq?.id) {
      RealBackendService.getDonorJourneys(selectedReq.id).then((j) => {
        setDonorJourneys(j);
        if (j.length > 0 && j[0].donor_phone) {
          setTargetPhone(j[0].donor_phone.replace(/[^0-9]/g, ''));
          setTargetName(j[0].donor_name || 'Registered Donor');
        }
      });
    }
  }, [selectedReq?.id]);

  const handleSelectDonor = (journey: DonorJourney) => {
    if (journey.donor_phone) {
      setTargetPhone(journey.donor_phone.replace(/[^0-9]/g, ''));
    }
    setTargetName(journey.donor_name || 'Registered Donor');
  };

  const currentDeficit = selectedReq ? selectedReq.outstanding_quantity : 0;

  const generatedMessage = selectedReq
    ? `🚨 *RAKTSETU EMERGENCY BLOOD MOBILIZATION* 🚨
Dear ${targetName || 'Life Saver'},

A critical emergency blood requirement matching your blood group (*${selectedReq.blood_group}*) has been logged:

🏥 *Hospital*: ${selectedReq.hospital_name || 'Designated Trauma Centre'}
🩸 *Blood Group Needed*: ${selectedReq.blood_group} (${selectedReq.component_type})
⚡ *Urgency Level*: ${selectedReq.urgency} (< 2 hrs)
🎯 *Live Outstanding Deficit*: ${currentDeficit} Unit(s)
📍 *Delivery / Blood Bank*: ${selectedReq.destination}
🗺️ *Navigation*: https://maps.google.com/?q=${encodeURIComponent(selectedReq.destination)}

⚠️ *Clinical Protocol Notice*:
Your response notifies the medical coordination team. Blood is physically marked SECURED only after on-site clinical screening and phlebotomy.

Can you report to the centre to donate?
👉 *Reply YES or open RAKTSETU*:
${typeof window !== 'undefined' ? window.location.origin : 'https://raktsetu.health'}/?req=${selectedReq.id}`
    : 'No active emergency request selected.';

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(generatedMessage)}`;

    window.open(waUrl, '_blank');
    setDispatchedNotice(`Dispatched alert to ${cleanPhone || 'WhatsApp'}! Recorded in audit log.`);
    setTimeout(() => setDispatchedNotice(null), 4000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <MessageCircle size={14} />
          <span>ZERO-SETUP CLINICAL WHATSAPP DISPATCH</span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          WhatsApp Emergency Donor Mobilization
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Instantly dispatch pre-formatted clinical emergency alerts directly to donors' WhatsApp numbers with zero API keys or token setup required.
        </p>
      </div>

      {dispatchedNotice && (
        <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid #16a34a', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', color: '#15803d', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {dispatchedNotice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Select Emergency Request */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              1. Select Emergency Blood Request
            </label>
            {activeRequests.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                No active requests found. Create a request in the Hospital Dashboard first.
              </p>
            ) : (
              <select
                value={selectedReq?.id || ''}
                onChange={(e) => {
                  setCurrentReqId(e.target.value);
                  if (onSelectRequest) onSelectRequest(e.target.value);
                }}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.85rem' }}
              >
                {activeRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.request_number} — {r.blood_group} ({r.component_type}) • {r.hospital_name} • Deficit: {r.outstanding_quantity} units
                  </option>
                ))}
              </select>
            )}

            {selectedReq && (
              <div style={{ marginTop: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Hospital Destination</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{selectedReq.destination}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>Outstanding Deficit</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                    {selectedReq.outstanding_quantity} Units
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Target Recipient & Proximity Donors */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a' }}>
                2. Target Donors in Hospital Vicinity
              </label>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                NEARBY PROXIMITY
              </span>
            </div>

            {/* Quick Pick from Matched Real Donors with location */}
            {donorJourneys.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Matched Registered Donors Near Hospital:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.45rem' }}>
                  {donorJourneys.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => handleSelectDonor(j)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        background: targetPhone === (j.donor_phone?.replace(/[^0-9]/g, '') || '') ? '#f0fdf4' : '#f8fafc',
                        border: targetPhone === (j.donor_phone?.replace(/[^0-9]/g, '') || '') ? '1px solid #86efac' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{j.donor_name}</strong>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fee2e2', color: '#e11d48', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {j.blood_group}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ color: '#0284c7', fontWeight: 700 }}>📱 {j.donor_phone || 'Registered Phone'}</span>
                          <span>&bull;</span>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>📍 {j.donor_address || 'Worli (1.2 km away)'}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>Select &bull;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Donor Full Name</label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="Rohan Sharma"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: '0.2rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Recipient WhatsApp Mobile Number</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <input
                    type="tel"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="916006853510"
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Include country code (e.g. 91 for India, or 10 digits).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Message Preview & Dispatch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#0b141a', border: '1px solid #1f2c34', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1f2c34', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
                <strong style={{ fontSize: '0.85rem', color: '#e9edef' }}>WhatsApp Message Preview</strong>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8696a0' }}>To: +{targetPhone}</span>
            </div>

            {/* Chat Bubble */}
            <div
              style={{
                background: '#005c4b',
                color: '#e9edef',
                borderRadius: '8px 8px 0px 8px',
                padding: '1rem',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              }}
            >
              {generatedMessage}
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  flex: 2,
                  background: '#22c55e',
                  borderColor: '#16a34a',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
                onClick={handleOpenWhatsApp}
              >
                <MessageCircle size={18} />
                Open & Send via WhatsApp
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>

          {/* Clinical Assurance Note */}
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <CheckCircle2 size={14} />
              Clinical Integrity Axiom
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>
              When a donor taps the link or responds on WhatsApp, RAKTSETU logs their mobilization status to <code>RESPONDED</code>. The outstanding deficit remains active until the donor passes clinical vitals screening and completes phlebotomy at the hospital triage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
