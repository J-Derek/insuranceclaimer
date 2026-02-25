import { ClaimStatus } from '@prisma/client';

// Valid state transitions map
const VALID_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
    DRAFT: [ClaimStatus.SUBMITTED],
    SUBMITTED: [ClaimStatus.UNDER_REVIEW],
    UNDER_REVIEW: [ClaimStatus.FRAUD_CHECK],
    FRAUD_CHECK: [ClaimStatus.APPROVED, ClaimStatus.REJECTED, ClaimStatus.INVESTIGATION],
    APPROVED: [ClaimStatus.PAYMENT_PENDING],
    REJECTED: [ClaimStatus.DISPUTED],
    INVESTIGATION: [ClaimStatus.APPROVED, ClaimStatus.REJECTED],
    PAYMENT_PENDING: [ClaimStatus.SETTLED, ClaimStatus.DISPUTED],
    SETTLED: [ClaimStatus.CLOSED],
    DISPUTED: [ClaimStatus.UNDER_REVIEW],
    CLOSED: [ClaimStatus.ARCHIVED],
    ARCHIVED: [], // Terminal state
};

// Roles allowed to trigger each transition
const TRANSITION_ROLES: Record<string, string[]> = {
    'DRAFT->SUBMITTED': ['POLICYHOLDER'],
    'SUBMITTED->UNDER_REVIEW': ['ADMIN', 'CLAIMS_ADJUSTER'],
    'UNDER_REVIEW->FRAUD_CHECK': ['CLAIMS_ADJUSTER', 'ADMIN'],
    'FRAUD_CHECK->APPROVED': ['CLAIMS_ADJUSTER', 'ADMIN'],
    'FRAUD_CHECK->REJECTED': ['CLAIMS_ADJUSTER', 'ADMIN'],
    'FRAUD_CHECK->INVESTIGATION': ['FRAUD_ANALYST', 'ADMIN'],
    'INVESTIGATION->APPROVED': ['FRAUD_ANALYST', 'ADMIN'],
    'INVESTIGATION->REJECTED': ['FRAUD_ANALYST', 'ADMIN'],
    'APPROVED->PAYMENT_PENDING': ['ADMIN'],
    'REJECTED->DISPUTED': ['POLICYHOLDER'],
    'PAYMENT_PENDING->SETTLED': ['ADMIN'],
    'PAYMENT_PENDING->DISPUTED': ['POLICYHOLDER'],
    'SETTLED->CLOSED': ['ADMIN'],
    'DISPUTED->UNDER_REVIEW': ['ADMIN'],
    'CLOSED->ARCHIVED': ['ADMIN'],
};

export function isValidTransition(from: ClaimStatus, to: ClaimStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canRoleTransition(
    from: ClaimStatus,
    to: ClaimStatus,
    role: string,
): boolean {
    const key = `${from}->${to}`;
    const allowedRoles = TRANSITION_ROLES[key];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
}

export function getValidTransitions(status: ClaimStatus): ClaimStatus[] {
    return VALID_TRANSITIONS[status] || [];
}

export function requiresReason(toStatus: ClaimStatus): boolean {
    return [ClaimStatus.REJECTED, ClaimStatus.DISPUTED, ClaimStatus.INVESTIGATION].includes(toStatus);
}
