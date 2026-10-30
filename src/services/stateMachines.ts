import {
  BloodGroup,
  BloodUnitStatus,
  ComponentType,
  DonorJourneyStatus,
  RequestStatus,
} from '../types';

export function calculateOutstanding(required: number, secured: number): number {
  return Math.max(Math.max(0, required) - Math.max(0, secured), 0);
}

export function isBloodCompatible(
  donorGroup: BloodGroup,
  recipientGroup: BloodGroup,
  component: ComponentType
): boolean {
  if (component === 'PLASMA') {
    const plasmaMap: Record<BloodGroup, BloodGroup[]> = {
      'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
      'AB-': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A+', 'A-', 'O+', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B+', 'B-', 'O+', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O+', 'O-'],
    };
    return (plasmaMap[donorGroup] || []).includes(recipientGroup);
  }

  const rbcMap: Record<BloodGroup, BloodGroup[]> = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
  };

  return (rbcMap[donorGroup] || []).includes(recipientGroup);
}

const DONOR_ALLOWED_TRANSITIONS: Record<DonorJourneyStatus, DonorJourneyStatus[]> = {
  ALERTED: ['RESPONDED', 'DECLINED', 'UNRESPONSIVE', 'CANCELLED'],
  RESPONDED: ['COORDINATING', 'ON_THE_WAY', 'ARRIVED', 'DECLINED', 'UNRESPONSIVE', 'CANCELLED'],
  COORDINATING: ['ON_THE_WAY', 'ARRIVED', 'DID_NOT_ARRIVE', 'DECLINED', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED', 'DID_NOT_ARRIVE', 'CANCELLED'],
  ARRIVED: ['SCREENING_PENDING', 'SCREENING_CLEARED', 'SCREENING_FAILED', 'CANCELLED'],
  SCREENING_PENDING: ['SCREENING_CLEARED', 'SCREENING_FAILED', 'CANCELLED'],
  SCREENING_CLEARED: ['DONATION_CONFIRMED', 'DONATION_NOT_COMPLETED', 'CANCELLED'],
  DONATION_CONFIRMED: [],
  DECLINED: [],
  UNRESPONSIVE: [],
  CANCELLED: [],
  SCREENING_FAILED: [],
  DID_NOT_ARRIVE: [],
  DONATION_NOT_COMPLETED: [],
};

export function canTransitionDonorState(
  current: DonorJourneyStatus,
  next: DonorJourneyStatus
): { allowed: boolean; reason?: string } {
  if (current === next) return { allowed: true };
  const allowed = DONOR_ALLOWED_TRANSITIONS[current] || [];
  if (allowed.includes(next)) return { allowed: true };
  return {
    allowed: false,
    reason: `Invalid donor transition from ${current} to ${next}. Must follow clinical lifecycle.`,
  };
}

const BLOOD_ALLOWED_TRANSITIONS: Record<BloodUnitStatus, BloodUnitStatus[]> = {
  AVAILABLE: ['ALLOCATED', 'EXPIRED'],
  ALLOCATED: ['DISPATCHED', 'ALLOCATION_CANCELLED', 'EXPIRED'],
  DISPATCHED: ['IN_TRANSIT', 'DISPATCH_FAILED', 'RETURNED'],
  IN_TRANSIT: ['RECEIVED', 'DISPATCH_FAILED', 'RETURNED'],
  RECEIVED: ['SECURED', 'REJECTED', 'EXPIRED', 'RETURNED'],
  SECURED: [],
  ALLOCATION_CANCELLED: ['AVAILABLE'],
  DISPATCH_FAILED: ['RETURNED'],
  EXPIRED: [],
  REJECTED: [],
  RETURNED: ['AVAILABLE', 'EXPIRED'],
};

export function canTransitionBloodState(
  current: BloodUnitStatus,
  next: BloodUnitStatus
): { allowed: boolean; reason?: string } {
  if (current === next) return { allowed: true };
  const allowed = BLOOD_ALLOWED_TRANSITIONS[current] || [];
  if (allowed.includes(next)) return { allowed: true };
  return {
    allowed: false,
    reason: `Invalid blood unit transition from ${current} to ${next}. Cold storage inventory rules prohibit this step.`,
  };
}
