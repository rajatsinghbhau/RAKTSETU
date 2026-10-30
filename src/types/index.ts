// RAKTSETU - Production Healthcare Type Definitions
// Core Principle: DON'T JUST FIND A DONOR. SECURE THE BLOOD.

export type UserRole =
  | 'SUPER_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'HOSPITAL_COORDINATOR'
  | 'BLOOD_CENTRE_ADMIN'
  | 'BLOOD_CENTRE_OPERATOR'
  | 'DONOR'
  | 'PARTNER_ORGANIZATION'
  | 'AUDITOR';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ComponentType = 'WHOLE_BLOOD' | 'PRBC' | 'PLATELETS' | 'PLASMA' | 'CRYO';
export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'HIGH' | 'ROUTINE';

export type RequestStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PARTIALLY_SECURED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CLOSED_WITHOUT_FULFILMENT';

export type DonorJourneyStatus =
  | 'ALERTED'
  | 'RESPONDED'
  | 'COORDINATING'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'SCREENING_PENDING'
  | 'SCREENING_CLEARED'
  | 'DONATION_CONFIRMED'
  | 'DECLINED'
  | 'UNRESPONSIVE'
  | 'CANCELLED'
  | 'SCREENING_FAILED'
  | 'DID_NOT_ARRIVE'
  | 'DONATION_NOT_COMPLETED';

export type BloodUnitStatus =
  | 'AVAILABLE'
  | 'ALLOCATED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'SECURED'
  | 'ALLOCATION_CANCELLED'
  | 'DISPATCH_FAILED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'RETURNED';

export type OrganizationType = 'HOSPITAL' | 'BLOOD_CENTRE' | 'PARTNER';

export interface Profile {
  id: string; // references auth.users(id)
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  city: string;
  state: string;
  address: string;
  verified: boolean;
  license_number: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

export interface DonorProfile {
  id: string;
  user_id: string;
  blood_group: BloodGroup;
  city: string;
  approximate_area: string;
  availability_status: 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARY_DEFERRAL';
  consent_status: boolean;
  verification_status: 'VERIFIED' | 'PENDING' | 'SUSPENDED';
  last_donation_date?: string;
  total_donations: number;
  preferred_contact: string;
  created_at: string;
}

export interface BloodRequest {
  id: string;
  request_number: string;
  organization_id: string;
  created_by: string;
  blood_group: BloodGroup;
  component_type: ComponentType;
  required_quantity: number;
  secured_quantity: number;
  outstanding_quantity: number;
  urgency: UrgencyLevel;
  required_by: string;
  destination: string;
  patient_reference?: string;
  notes?: string;
  status: RequestStatus;
  active_waves_count: number;
  is_rare_blood?: boolean;
  rare_phenotype?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // joined fields
  hospital_name?: string;
  creator_name?: string;
}

export interface DonorJourney {
  id: string;
  request_id: string;
  donor_id: string;
  wave_number: number;
  status: DonorJourneyStatus;
  alerted_at: string;
  responded_at?: string;
  arrived_at?: string;
  screening_completed_at?: string;
  screening_result?: 'PASSED' | 'FAILED';
  screening_notes?: string;
  donation_confirmed_at?: string;
  donation_units?: number;
  failure_reason?: string;
  updated_at: string;
  // joined fields
  donor_name?: string;
  blood_group?: BloodGroup;
  donor_phone?: string;
  donor_address?: string;
  donor_city?: string;
}

export interface BloodUnit {
  id: string;
  unit_code: string;
  blood_centre_id: string;
  blood_group: BloodGroup;
  component_type: ComponentType;
  status: BloodUnitStatus;
  inventory_location: string;
  collection_reference: string;
  collection_date: string;
  expiry_date: string;
  allocated_request_id?: string;
  dispatched_at?: string;
  received_at?: string;
  secured_at?: string;
  created_at: string;
  // joined fields
  blood_centre_name?: string;
}

export interface FulfilmentRecord {
  id: string;
  request_id: string;
  source_type: 'DONOR' | 'INVENTORY' | 'PARTNER';
  source_id: string;
  source_reference: string;
  quantity: number;
  confirmed_by: string;
  confirmed_at: string;
  confirmation_type: string;
  notes?: string;
  audit_reference: string;
  // joined
  confirmed_by_name?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_id?: string;
  actor_role: UserRole;
  organization_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  request_id?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  // joined
  actor_name?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  request_id?: string;
  created_at: string;
}
