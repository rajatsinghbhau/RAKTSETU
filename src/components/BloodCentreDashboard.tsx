import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Droplet,
  ExternalLink,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Snowflake,
  Truck,
  XCircle
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { BloodGroup, BloodRequest, BloodUnit, ComponentType, Organization, Profile } from '../types';

interface BloodCentreProps {
  currentUserProfile: Profile | null;
  onOpenAuth: () => void;
  requests: BloodRequest[];
  onRefreshData: () => void;
}

export const BloodCentreDashboard: React.FC<BloodCentreProps> = ({
  currentUserProfile,
  onOpenAuth,
  requests,
  onRefreshData,
}) => {
  const [inventory, setInventory] = useState<BloodUnit[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUnitForAllocation, setSelectedUnitForAllocation] = useState<BloodUnit | null>(null);
  const [targetReqId, setTargetReqId] = useState<string>('');
  const [allocError, setAllocError] = useState<string | null>(null);

  // New unit form state
  const [newCode, setNewCode] = useState('UNIT-AP-9901');
  const [newGroup, setNewGroup] = useState<BloodGroup>('A+');
  const [newComponent, setNewComponent] = useState<ComponentType>('PRBC');
  const [newLoc, setNewLoc] = useState('Cold Storage Shelf A-2 (4°C)');
  const [newRef, setNewRef] = useState('COL-2026-0419');
  const [newExpiry, setNewExpiry] = useState('2026-11-28');
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');

  const fetchUnits = () => {
    RealBackendService.getInventory().then(setInventory);
    RealBackendService.getOrganizations().then((o) => {
      setOrgs(o);
      const bloodBanks = o.filter((x) => x.type === 'BLOOD_CENTRE');
      if (bloodBanks.length > 0 && !selectedCentreId) {
        setSelectedCentreId(bloodBanks[0].id);
      }
    });
  };

  React.useEffect(() => {
    fetchUnits();
  }, []);

  const activeRequests = requests.filter((r) => ['OPEN', 'PARTIALLY_SECURED'].includes(r.status));

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }

    const centreId = selectedCentreId || orgs[0]?.id;
    if (!centreId) {
      alert('Please register a blood centre organization first in the Admin tab.');
      return;
    }

    const res = await RealBackendService.addBloodUnit({
      unitCode: newCode,
      bloodCentreId: centreId,
      bloodGroup: newGroup,
      componentType: newComponent,
      inventoryLocation: newLoc,
      collectionReference: newRef,
      collectionDate: new Date().toISOString().split('T')[0],
      expiryDate: newExpiry,
    });

    if (res.success) {
      setShowAddModal(false);
      fetchUnits();
      onRefreshData();
    } else {
      alert(res.error || 'Failed to add blood unit to database.');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitForAllocation || !targetReqId) return;
    setAllocError(null);

    const res = await RealBackendService.allocateBloodUnit(selectedUnitForAllocation.id, targetReqId);
    if (!res.success) {
      setAllocError(res.error || 'Allocation failed');
    } else {
      setSelectedUnitForAllocation(null);
      fetchUnits();
      onRefreshData();
    }
  };

  const handleDispatch = async (unitId: string) => {
    await RealBackendService.dispatchBloodUnit(unitId);
    fetchUnits();
    onRefreshData();
  };

  const handleReceive = async (unitId: string) => {
    await RealBackendService.receiveBloodUnit(unitId);
    fetchUnits();
    onRefreshData();
  };

  const handleAuthorizedConfirm = async (unit: BloodUnit) => {
    if (!unit.allocated_request_id) return;
    await RealBackendService.confirmFulfilment({
      requestId: unit.allocated_request_id,
      sourceType: 'INVENTORY',
      sourceId: unit.id,
      sourceReference: `Unit ${unit.unit_code} (${unit.blood_group} ${unit.component_type})`,
      quantity: 1,
      confirmationType: 'BLOOD_BANK_TRANSFER',
      notes: 'Cold container validated at hospital reception with compliant temperature log.',
    });
    fetchUnits();
    onRefreshData();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Cold-Chain Logistics Management
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Blood Centre & Inventory Console
          </h2>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (!currentUserProfile) onOpenAuth();
            else setShowAddModal(true);
          }}
        >
          <Plus size={16} /> Add Blood Unit to Cold Storage
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="clinical-table">
          <thead>
            <tr>
              <th>Unit Barcode</th>
              <th>Centre & Location</th>
              <th>Blood Group</th>
              <th>Component</th>
              <th>Status</th>
              <th>Expiry Date</th>
              <th>Allocated Request</th>
              <th>Cold-Chain Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No blood units currently stored in database. Click "Add Blood Unit to Cold Storage" to log real verified inventory.
                </td>
              </tr>
            ) : (
              inventory.map((unit) => {
                const isAvailable = unit.status === 'AVAILABLE';
                const isAllocated = unit.status === 'ALLOCATED';
                const isDispatched = unit.status === 'DISPATCHED';
                const isReceived = unit.status === 'RECEIVED';
                const isSecured = unit.status === 'SECURED';

                return (
                  <tr key={unit.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {unit.unit_code}
                      </strong>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{unit.blood_centre_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {unit.inventory_location}
                      </div>
                    </td>
                    <td>
                      <span className="blood-group-tag">{unit.blood_group}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{unit.component_type}</td>
                    <td>
                      <span
                        className={`badge ${
                          isSecured
                            ? 'badge-secured'
                            : isAvailable
                            ? 'badge-open'
                            : isAllocated
                            ? 'badge-outstanding'
                            : 'badge-neutral'
                        }`}
                      >
                        {unit.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {unit.expiry_date}
                    </td>
                    <td>
                      {unit.allocated_request_id ? (
                        <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>
                          #{unit.allocated_request_id.substring(0, 8)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {isAvailable && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedUnitForAllocation(unit)}
                          >
                            Allocate
                          </button>
                        )}

                        {isAllocated && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#c084fc' }}
                            onClick={() => handleDispatch(unit.id)}
                          >
                            <Truck size={12} /> Dispatch
                          </button>
                        )}

                        {isDispatched && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#38bdf8' }}
                            onClick={() => handleReceive(unit.id)}
                          >
                            Mark Received
                          </button>
                        )}

                        {isReceived && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAuthorizedConfirm(unit)}
                          >
                            <CheckCircle2 size={12} /> Secure Unit
                          </button>
                        )}

                        {isSecured && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--secured-green)', fontWeight: 700 }}>
                            ✓ Fulfilled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Add Verified Blood Unit to Database
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUnit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Blood Centre Facility *
                  </label>
                  <select
                    value={selectedCentreId}
                    onChange={(e) => setSelectedCentreId(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  >
                    {orgs.filter((o) => o.type === 'BLOOD_CENTRE').map((o) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.city})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Unit Barcode / Identifier *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    />
                  </div>

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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Component Type *
                    </label>
                    <select
                      value={newComponent}
                      onChange={(e) => setNewComponent(e.target.value as ComponentType)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    >
                      <option value="PRBC">PRBC</option>
                      <option value="WHOLE_BLOOD">Whole Blood</option>
                      <option value="PLATELETS">Platelets</option>
                      <option value="PLASMA">Plasma</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newExpiry}
                      onChange={(e) => setNewExpiry(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Storage Rack Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Unit to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {selectedUnitForAllocation && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Allocate Unit {selectedUnitForAllocation.unit_code}
              </h3>
              <button
                onClick={() => setSelectedUnitForAllocation(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allocError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.8rem' }}>
                    {allocError}
                  </div>
                )}

                <div className="notice-box">
                  <ShieldCheck size={18} color="#0284c7" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Concurrency Lock:</strong>
                    <p style={{ marginTop: '0.2rem' }}>
                      Locks unit row to prevent double-allocation across multiple operators. (Note: Allocation != Secured Blood until confirmed by doctor).
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Select Target Emergency Request *
                  </label>
                  <select
                    value={targetReqId}
                    onChange={(e) => setTargetReqId(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    required
                  >
                    <option value="">Select active request...</option>
                    {activeRequests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.request_number} &bull; {r.hospital_name} ({r.blood_group} {r.component_type} - Outstanding: {r.outstanding_quantity} units)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedUnitForAllocation(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Lock & Allocate Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
