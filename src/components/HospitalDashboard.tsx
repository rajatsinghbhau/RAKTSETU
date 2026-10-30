import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplet,
  ExternalLink,
  Layers,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import {
  BloodGroup,
  BloodRequest,
  ComponentType,
  DonorJourney,
  Profile,
  UrgencyLevel
} from '../types';

interface HospitalDashboardProps {
  requests: BloodRequest[];
  onSelectRequest: (id: string) => void;
  onNavigateToCommand: () => void;
  currentUserProfile: Profile | null;
  onRefreshData: () => void;
  onOpenAuth: () => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  requests,
  onSelectRequest,
  onNavigateToCommand,
  currentUserProfile,
  onRefreshData,
  onOpenAuth,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<BloodRequest | null>(null);
  const [journeys, setJourneys] = useState<DonorJourney[]>([]);

  // Create form state
  const [newGroup, setNewGroup] = useState<BloodGroup>('A+');
  const [newComponent, setNewComponent] = useState<ComponentType>('PRBC');
  const [newQuantity, setNewQuantity] = useState<number>(4);
  const [newUrgency, setNewUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [newDestination, setNewDestination] = useState('CityCare Hospital - ICU Bed 4');
  const [newPatientRef, setNewPatientRef] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isRareBlood, setIsRareBlood] = useState(false);
  const [rarePhenotype, setRarePhenotype] = useState('Bombay Phenotype (Oh / hh)');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (selectedReqForDetail) {
      RealBackendService.getDonorJourneys(selectedReqForDetail.id).then(setJourneys);
    }
  }, [selectedReqForDetail?.id]);

  const totalRequired = requests.reduce((sum, r) => sum + r.required_quantity, 0);
  const totalSecured = requests.reduce((sum, r) => sum + r.secured_quantity, 0);
  const totalOutstanding = requests.reduce((sum, r) => sum + r.outstanding_quantity, 0);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }
    setCreateError(null);
    setSubmitting(true);

    const notesWithRare = isRareBlood
      ? `[RARE_BLOOD: ${rarePhenotype}] ${newNotes}`
      : newNotes;

    const res = await RealBackendService.createEmergencyRequest({
      bloodGroup: newGroup,
      componentType: newComponent,
      requiredQuantity: Number(newQuantity),
      urgency: newUrgency,
      destination: newDestination,
      patientReference: newPatientRef,
      notes: notesWithRare,
    });

    setSubmitting(false);

    if (!res.success) {
      setCreateError(res.error || 'Failed to create emergency request in Supabase.');
      return;
    }

    setShowCreateModal(false);
    onRefreshData();
    if (res.request) {
      onSelectRequest(res.request.id);
      onNavigateToCommand();
    }
  };

  const [confirmingJourneyId, setConfirmingJourneyId] = useState<string | null>(null);

  const handleAdvanceJourney = async (journeyId: string, nextStatus: any, meta?: any) => {
    setConfirmingJourneyId(journeyId);
    const res = await RealBackendService.updateDonorJourneyStage(journeyId, nextStatus, meta);
    setConfirmingJourneyId(null);
    if (!res.success) {
      alert(`Screening Update Notice: ${res.error || 'Failed to update donor status'}`);
      return;
    }
    if (selectedReqForDetail) {
      const refreshed = await RealBackendService.getDonorJourneys(selectedReqForDetail.id);
      setJourneys(refreshed);
    }
    onRefreshData();
  };

  const handleConfirmDonorUnit = async (journey: DonorJourney) => {
    if (!selectedReqForDetail) return;
    setConfirmingJourneyId(journey.id);
    const res = await RealBackendService.confirmFulfilment({
      requestId: selectedReqForDetail.id,
      sourceType: 'DONOR',
      sourceId: journey.donor_id,
      sourceReference: `Donor: ${journey.donor_name || 'Verified Donor'}`,
      quantity: 1,
      confirmationType: 'CLINICAL_VERIFIED',
      notes: 'Donor completed clinical phlebotomy at hospital triage.',
      journeyId: journey.id,
    });
    setConfirmingJourneyId(null);
    if (!res.success) {
      alert(`Fulfilment Error: ${res.error || 'Failed to confirm donor unit'}`);
      return;
    }
    // refresh journeys
    const refreshed = await RealBackendService.getDonorJourneys(selectedReqForDetail.id);
    setJourneys(refreshed);
    onRefreshData();
  };

  const [twilioStatus, setTwilioStatus] = useState<{ [journeyId: string]: string }>({});

  const handleSendTwilioAlert = async (journey: DonorJourney) => {
    if (!selectedReqForDetail) return;
    if (!journey.donor_phone) {
      alert(`No phone number registered for donor ${journey.donor_name}.`);
      return;
    }
    setTwilioStatus((prev) => ({ ...prev, [journey.id]: 'SENDING...' }));
    
    const message = 
`🚨 *RAKTSETU EMERGENCY BLOOD ALERT* 🚨
Dear ${journey.donor_name || 'Donor'},

Emergency match for ${selectedReqForDetail.blood_group} ${selectedReqForDetail.component_type} needed at ${selectedReqForDetail.hospital_name}.
📍 Location: ${selectedReqForDetail.destination}
🎯 Outstanding Deficit: ${selectedReqForDetail.outstanding_quantity} Unit(s)

If available to donate, please open RAKTSETU:
${window.location.origin}/?req=${selectedReqForDetail.id}`;

    const res = await RealBackendService.sendTwilioWhatsAppMessage(journey.donor_phone, message, {
      requestId: selectedReqForDetail.id,
      journeyId: journey.id,
      donorId: journey.donor_id,
    });

    if (res.success) {
      setTwilioStatus((prev) => ({ ...prev, [journey.id]: `SENT (${res.messageSid?.slice(-6)})` }));
    } else {
      setTwilioStatus((prev) => ({ ...prev, [journey.id]: `FAILED: ${res.error}` }));
    }
  };

  return (
    <div>
      {/* Top Banner & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Emergency Hospital Operations
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Hospital Fulfilment Dashboard
          </h2>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (!currentUserProfile) onOpenAuth();
            else setShowCreateModal(true);
          }}
        >
          <Plus size={16} />
          Create Emergency Blood Request
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Total Emergencies
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {requests.length}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Total Required
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {totalRequired} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>units</span>
          </div>
        </div>

        <div style={{ background: 'var(--secured-bg)', border: '1px solid var(--secured-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700 }}>
            Confirmed Secured
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
            {totalSecured} <span style={{ fontSize: '0.9rem', color: 'rgba(52, 211, 153, 0.7)' }}>units</span>
          </div>
        </div>

        {/* Total Outstanding Metric */}
        <div style={{ background: 'var(--amber-bg)', border: '2px solid var(--amber-border)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: 'var(--shadow-glow-amber)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#fbbf24', fontWeight: 800 }}>
            ★ Total Outstanding
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {totalOutstanding} <span style={{ fontSize: '0.9rem', color: 'rgba(251, 191, 36, 0.7)' }}>units</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#fbbf24', marginTop: '0.25rem' }}>Authoritative PostgreSQL Deficit</div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="table-container">
        <table className="clinical-table">
          <thead>
            <tr>
              <th>Request Number</th>
              <th>Hospital & Destination</th>
              <th>Group & Component</th>
              <th>Required</th>
              <th>Secured</th>
              <th style={{ color: 'var(--amber-outstanding)' }}>Outstanding</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No emergency requests found in database. Click "Create Emergency Blood Request" to log a real requirement.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {req.request_number}
                    </strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.hospital_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {req.destination}
                    </div>
                  </td>
                  <td>
                    <span className="blood-group-tag" style={{ marginRight: '6px' }}>
                      {req.blood_group}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {req.component_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.required_quantity}</td>
                  <td style={{ fontWeight: 700, color: '#16a34a' }}>{req.secured_quantity}</td>
                  <td style={{ fontWeight: 800, color: '#d97706', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                    {req.outstanding_quantity}
                  </td>
                  <td>
                    <span className={`badge ${req.urgency === 'CRITICAL' ? 'badge-critical' : 'badge-urgent'}`}>
                      {req.urgency}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        req.status === 'FULFILLED'
                          ? 'badge-secured'
                          : req.status === 'PARTIALLY_SECURED'
                          ? 'badge-outstanding'
                          : 'badge-critical'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedReqForDetail(req)}
                      >
                        Coordinate
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          onSelectRequest(req.id);
                          onNavigateToCommand();
                        }}
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Emergency Request Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--blood-red)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Create Real Emergency Blood Request
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {createError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.8rem' }}>
                    {createError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Blood Group *
                    </label>
                    <select
                      value={newGroup}
                      onChange={(e) => setNewGroup(e.target.value as BloodGroup)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Component Type *
                    </label>
                    <select
                      value={newComponent}
                      onChange={(e) => setNewComponent(e.target.value as ComponentType)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    >
                      <option value="PRBC">Packed Red Blood Cells (PRBC)</option>
                      <option value="WHOLE_BLOOD">Whole Blood</option>
                      <option value="PLATELETS">Platelets</option>
                      <option value="PLASMA">Plasma (FFP)</option>
                      <option value="CRYO">Cryoprecipitate</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Required Units * (1 - 20)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Urgency Level *
                    </label>
                    <select
                      value={newUrgency}
                      onChange={(e) => setNewUrgency(e.target.value as UrgencyLevel)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    >
                      <option value="CRITICAL">CRITICAL (&lt; 2 hrs)</option>
                      <option value="URGENT">URGENT (2 - 4 hrs)</option>
                      <option value="HIGH">HIGH (4 - 8 hrs)</option>
                      <option value="ROUTINE">ROUTINE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Destination & Delivery Point *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Patient Emergency Tag (MRN / Reference)
                  </label>
                  <input
                    type="text"
                    value={newPatientRef}
                    onChange={(e) => setNewPatientRef(e.target.value)}
                    placeholder="PAT-2026-EMG"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  />
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
                    <input
                      type="checkbox"
                      checked={isRareBlood}
                      onChange={(e) => setIsRareBlood(e.target.checked)}
                      style={{ accentColor: '#dc2626' }}
                    />
                    <span>🔴 Activate Rare Phenotype Emergency Orchestration</span>
                  </label>
                  {isRareBlood && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Verified Rare Phenotype Requirement
                      </label>
                      <select
                        value={rarePhenotype}
                        onChange={(e) => setRarePhenotype(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}
                      >
                        <option value="Bombay Phenotype (Oh / hh)">Bombay Phenotype (Oh / hh)</option>
                        <option value="Rh-null (Golden Blood)">Rh-null (Golden Blood)</option>
                        <option value="Duffy Negative (Fy(a-b-))">Duffy Negative (Fy(a-b-))</option>
                        <option value="Kidd Null (Jk(a-b-))">Kidd Null (Jk(a-b-))</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Clinical Indications & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Acute surgical trauma with active hemorrhage."
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Inserting into Supabase...' : 'Submit Emergency Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coordination Drawer */}
      {selectedReqForDetail && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="blood-group-tag">{selectedReqForDetail.blood_group}</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedReqForDetail.request_number} &bull; On-Site Coordination
                  </h3>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Destination: {selectedReqForDetail.destination}
                </div>
              </div>
              <button
                onClick={() => setSelectedReqForDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Stat block */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Required</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedReqForDetail.required_quantity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>Secured</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>{selectedReqForDetail.secured_quantity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#d97706' }}>Outstanding</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-mono)' }}>{selectedReqForDetail.outstanding_quantity}</div>
                </div>
              </div>

              {journeys.some((j) => j.status === 'SCREENING_FAILED' || j.status === 'DID_NOT_ARRIVE' || j.failure_reason) && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>
                    ⚠️ SUPPLY PATH FAILED: Donor unavailable / screening deferral. Outstanding requirement strictly preserved ({selectedReqForDetail.outstanding_quantity} units). Backup Mobilisation Wave activated.
                  </span>
                </div>
              )}

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Mobilized Real Donors (Supabase donor_journeys)
              </h4>

              {journeys.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
                  No matching registered donors found in database for {selectedReqForDetail.blood_group}. Register real donors in the Donor Hub to populate this list.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {journeys.map((j) => (
                    <div
                      key={j.id}
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{j.donor_name}</strong>
                          <span className="blood-group-tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>
                            {j.blood_group}
                          </span>
                          <span className="badge badge-open">{j.status}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {j.donor_phone && (
                            <span style={{ color: '#0284c7', fontWeight: 700 }}>
                              📱 {j.donor_phone}
                            </span>
                          )}
                          {j.donor_address && (
                            <span style={{ color: '#15803d', fontWeight: 600 }}>
                              📍 {j.donor_address}
                            </span>
                          )}
                          <span>Alerted: {new Date(j.alerted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {j.responded_at && <span>• Responded: {new Date(j.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <a
                          href={RealBackendService.generateWhatsAppAlertUrl({
                            phone: j.donor_phone,
                            donorName: j.donor_name,
                            hospitalName: selectedReqForDetail.hospital_name,
                            bloodGroup: selectedReqForDetail.blood_group,
                            component: selectedReqForDetail.component_type,
                            urgency: selectedReqForDetail.urgency,
                            destination: selectedReqForDetail.destination,
                            outstandingQuantity: selectedReqForDetail.outstanding_quantity,
                            requestId: selectedReqForDetail.id,
                            journeyId: j.id,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm"
                          style={{
                            background: '#15803d',
                            color: '#fff',
                            borderColor: '#22c55e',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            textDecoration: 'none',
                          }}
                          title="Open WhatsApp Alert for this donor"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>

                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            borderColor: '#38bdf8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                          }}
                          onClick={() => handleSendTwilioAlert(j)}
                          disabled={twilioStatus[j.id] === 'SENDING...'}
                          title="Trigger automated Twilio WhatsApp dispatch"
                        >
                          <Zap size={13} /> {twilioStatus[j.id] || 'Twilio Alert'}
                        </button>

                        {j.status === 'ALERTED' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAdvanceJourney(j.id, 'RESPONDED')}
                            disabled={confirmingJourneyId === j.id}
                          >
                            Mark Responded
                          </button>
                        )}

                        {j.status === 'RESPONDED' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAdvanceJourney(j.id, 'ARRIVED')}
                            disabled={confirmingJourneyId === j.id}
                          >
                            Mark Arrived
                          </button>
                        )}

                        {(j.status === 'ARRIVED' || j.status === 'SCREENING_PENDING') && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleAdvanceJourney(j.id, 'SCREENING_CLEARED')}
                              disabled={confirmingJourneyId === j.id}
                            >
                              <ShieldCheck size={13} /> {confirmingJourneyId === j.id ? 'Updating...' : 'Pass Screening'}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#f87171' }}
                              onClick={() => handleAdvanceJourney(j.id, 'SCREENING_FAILED', { failureReason: 'Hemoglobin below 12.5 g/dL' })}
                              disabled={confirmingJourneyId === j.id}
                            >
                              <XCircle size={13} /> Fail Screening
                            </button>
                          </>
                        )}

                        {j.status === 'SCREENING_CLEARED' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConfirmDonorUnit(j)}
                            disabled={confirmingJourneyId === j.id}
                          >
                            <CheckCircle2 size={13} /> {confirmingJourneyId === j.id ? 'Securing Unit...' : 'Confirm 1 Unit Secured'}
                          </button>
                        )}

                        {j.status === 'DONATION_CONFIRMED' && (
                          <span
                            className="badge badge-secured"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
                          >
                            <CheckCircle2 size={13} /> 1 Unit Secured & Transfused
                          </span>
                        )}

                        {j.status === 'SCREENING_FAILED' && (
                          <span
                            className="badge badge-critical"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
                          >
                            <XCircle size={13} /> Screening Disqualified
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
