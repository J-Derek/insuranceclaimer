import { ClaimStatus } from '@prisma/client';
import { isValidTransition, canRoleTransition, requiresReason, getValidTransitions } from './claims-state.machine';

describe('ClaimsStateMachine', () => {
    describe('isValidTransition', () => {
        it('should allow DRAFT → SUBMITTED', () => {
            expect(isValidTransition(ClaimStatus.DRAFT, ClaimStatus.SUBMITTED)).toBe(true);
        });

        it('should allow SUBMITTED → UNDER_REVIEW', () => {
            expect(isValidTransition(ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW)).toBe(true);
        });

        it('should allow FRAUD_CHECK → APPROVED', () => {
            expect(isValidTransition(ClaimStatus.FRAUD_CHECK, ClaimStatus.APPROVED)).toBe(true);
        });

        it('should allow FRAUD_CHECK → REJECTED', () => {
            expect(isValidTransition(ClaimStatus.FRAUD_CHECK, ClaimStatus.REJECTED)).toBe(true);
        });

        it('should allow FRAUD_CHECK → INVESTIGATION', () => {
            expect(isValidTransition(ClaimStatus.FRAUD_CHECK, ClaimStatus.INVESTIGATION)).toBe(true);
        });

        it('should block DRAFT → APPROVED (skip review)', () => {
            expect(isValidTransition(ClaimStatus.DRAFT, ClaimStatus.APPROVED)).toBe(false);
        });

        it('should block SUBMITTED → APPROVED (skip review)', () => {
            expect(isValidTransition(ClaimStatus.SUBMITTED, ClaimStatus.APPROVED)).toBe(false);
        });

        it('should block SETTLED → SUBMITTED (cannot un-settle)', () => {
            expect(isValidTransition(ClaimStatus.SETTLED, ClaimStatus.SUBMITTED)).toBe(false);
        });

        it('should block ARCHIVED → anything (terminal state)', () => {
            const allStatuses = Object.values(ClaimStatus);
            allStatuses.forEach((status) => {
                expect(isValidTransition(ClaimStatus.ARCHIVED, status)).toBe(false);
            });
        });

        it('should block any → DRAFT (initial only)', () => {
            const nonDraftStatuses = Object.values(ClaimStatus).filter(s => s !== ClaimStatus.DRAFT);
            nonDraftStatuses.forEach((status) => {
                expect(isValidTransition(status, ClaimStatus.DRAFT)).toBe(false);
            });
        });
    });

    describe('canRoleTransition', () => {
        it('should allow POLICYHOLDER to submit', () => {
            expect(canRoleTransition(ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, 'POLICYHOLDER')).toBe(true);
        });

        it('should block POLICYHOLDER from approving', () => {
            expect(canRoleTransition(ClaimStatus.FRAUD_CHECK, ClaimStatus.APPROVED, 'POLICYHOLDER')).toBe(false);
        });

        it('should allow CLAIMS_ADJUSTER to approve', () => {
            expect(canRoleTransition(ClaimStatus.FRAUD_CHECK, ClaimStatus.APPROVED, 'CLAIMS_ADJUSTER')).toBe(true);
        });

        it('should allow FRAUD_ANALYST to override investigation', () => {
            expect(canRoleTransition(ClaimStatus.INVESTIGATION, ClaimStatus.APPROVED, 'FRAUD_ANALYST')).toBe(true);
        });

        it('should allow ADMIN for all transitions', () => {
            expect(canRoleTransition(ClaimStatus.FRAUD_CHECK, ClaimStatus.APPROVED, 'ADMIN')).toBe(true);
            expect(canRoleTransition(ClaimStatus.SETTLED, ClaimStatus.CLOSED, 'ADMIN')).toBe(true);
        });
    });

    describe('requiresReason', () => {
        it('should require reason for REJECTED', () => {
            expect(requiresReason(ClaimStatus.REJECTED)).toBe(true);
        });

        it('should require reason for DISPUTED', () => {
            expect(requiresReason(ClaimStatus.DISPUTED)).toBe(true);
        });

        it('should require reason for INVESTIGATION', () => {
            expect(requiresReason(ClaimStatus.INVESTIGATION)).toBe(true);
        });

        it('should not require reason for APPROVED', () => {
            expect(requiresReason(ClaimStatus.APPROVED)).toBe(false);
        });
    });

    describe('getValidTransitions', () => {
        it('should return correct transitions for FRAUD_CHECK', () => {
            const valid = getValidTransitions(ClaimStatus.FRAUD_CHECK);
            expect(valid).toContain(ClaimStatus.APPROVED);
            expect(valid).toContain(ClaimStatus.REJECTED);
            expect(valid).toContain(ClaimStatus.INVESTIGATION);
            expect(valid).not.toContain(ClaimStatus.SUBMITTED);
        });

        it('should return empty array for ARCHIVED', () => {
            expect(getValidTransitions(ClaimStatus.ARCHIVED)).toEqual([]);
        });
    });
});
