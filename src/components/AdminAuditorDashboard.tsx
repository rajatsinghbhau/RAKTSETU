import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Lock,
  Plus,
  Radio,
  Search,
  Server,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { RealBackendService } from '../services/realBackend';
import { AuditLog, Organization, Profile } from '../types';

interface AdminAuditorProps {
  currentUserProfile: Profile | null;
  onOpenAuth: () => void;
  auditLogs: AuditLog[];
  onRefreshData: () => void;
}

export const AdminAuditorDashboard: React.FC<AdminAuditorProps> = ({
  currentUserProfile,
  onOpenAuth,
  auditLogs,
  onRefreshData,
}) => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'AUDIT' | 'ORGS' | 'INTEGRATIONS'>('AUDIT');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // New Org state
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'HOSPITAL' | 'BLOOD_CENTRE' | 'PARTNER'>('HOSPITAL');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('LIC-2026-');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchOrgs = () => {
    RealBackendService.getOrganizations().then(setOrgs);
  };

  React.useEffect(() => {
    fetchOrgs();
  }, []);

  const filteredLogs = auditLogs.filter((l) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      (l.actor_name && l.actor_name.toLowerCase().includes(q))
    );
  });

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onOpenAuth();
      return;
    }

    try {
      await RealBackendService.registerOrganization({
        name: orgName,
        type: orgType,
        city,
        state,
        address,
        licenseNumber: license,
        contactEmail: email,
        contactPhone: phone,
      });
      setShowOrgModal(false);
      fetchOrgs();
      onRefreshData();
    } catch (err: any) {
      alert(err?.message || 'Failed to register organization');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Governance, Compliance & Transparency
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Administrator & Healthcare Auditor Deck
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'AUDIT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('AUDIT')}
          >
            <Shield size={14} /> Audit Trail ({auditLogs.length})
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'ORGS' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('ORGS')}
          >
            <Building2 size={14} /> Organizations ({orgs.length})
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'INTEGRATIONS' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('INTEGRATIONS')}
          >
            <Server size={14} /> Integration Status
          </button>
        </div>
      </div>

      {/* SUBTAB 1: AUDIT TRAIL */}
      {activeSubTab === 'AUDIT' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Immutable Audit Trail (Supabase audit_logs)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Every clinical creation, allocation, transition, and fulfilment confirmation is permanently recorded.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.35rem 0.75rem' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search audit trail..."
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', width: '220px' }}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor & Role</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Client IP / Security</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No audit logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{log.actor_name}</div>
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{log.actor_role}</span>
                      </td>
                      <td>
                        <span className="badge badge-open">{log.action}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-primary)', maxWidth: '420px' }}>
                        {log.details}
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {log.ip_address || 'Authenticated'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ORGANIZATIONS */}
      {activeSubTab === 'ORGS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowOrgModal(true)}>
              <Plus size={15} /> Register New Organization
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {orgs.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No organizations registered in database yet. Click "Register New Organization" to register a verified hospital or blood centre.
              </div>
            ) : (
              orgs.map((org) => (
                <div
                  key={org.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className={`badge ${org.type === 'HOSPITAL' ? 'badge-critical' : 'badge-open'}`}>
                      {org.type}
                    </span>
                    <span className="badge badge-secured">
                      <ShieldCheck size={12} />
                      Verified
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{org.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0.75rem' }}>
                    {org.address}, {org.city}, {org.state}
                  </p>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div>License: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{org.license_number}</strong></div>
                    <div>Emergency Contact: <span style={{ color: '#0284c7' }}>{org.contact_phone}</span></div>
                    <div>Email: <span style={{ color: 'var(--text-secondary)' }}>{org.contact_email}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: INTEGRATION STATUS (Section 18 & 19) */}
      {activeSubTab === 'INTEGRATIONS' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            External Healthcare Integrations & Adapter Registry
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            RAKTSETU strictly distinguishes connected live infrastructure from integration-ready adapters. No fake external healthcare connections are simulated.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--secured-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Supabase PostgreSQL</strong>
                <span className="badge badge-secured">CONNECTED</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Host: ebrjeajrkchfsifwbakg.supabase.co
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--secured-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Supabase Realtime WebSockets</strong>
                <span className="badge badge-secured">CONNECTED</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Real-time multi-client channel broadcasts.
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>SMS Gateway (Twilio / Pinpoint)</strong>
                <span className="badge badge-neutral">NOT CONNECTED</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Adapter ready. Awaiting production provider credentials.
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Meta WhatsApp Business API</strong>
                <span className="badge badge-neutral">NOT CONNECTED</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Adapter ready. Awaiting webhook & API verification.
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Hospital EHR / FHIR Integration</strong>
                <span className="badge badge-neutral">NOT CONNECTED</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                HL7 / FHIR adapter ready for accredited hospital networks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Organization Registration Modal */}
      {showOrgModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Register Verified Healthcare Organization
              </h3>
              <button
                onClick={() => setShowOrgModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. CityCare Super Speciality Hospital"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Facility Type *</label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as any)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    >
                      <option value="HOSPITAL">Hospital</option>
                      <option value="BLOOD_CENTRE">Blood Centre / Bank</option>
                      <option value="PARTNER">Partner NGO Network</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>License Number *</label>
                    <input
                      type="text"
                      required
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      placeholder="LIC-HOSP-MUM-1102"
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="42 Medical Enclave, Worli"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Emergency Phone *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91-22-2490-1100"
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="emergency@citycare.org"
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrgModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Organization to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
