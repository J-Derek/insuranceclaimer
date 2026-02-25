// KlaimSwift — Claim Status Visual Mapping
// Maps all 12 ClaimStatus values to visual properties

export type ClaimStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'FRAUD_CHECK'
    | 'APPROVED'
    | 'REJECTED'
    | 'INVESTIGATION'
    | 'PAYMENT_PENDING'
    | 'SETTLED'
    | 'DISPUTED'
    | 'CLOSED'
    | 'ARCHIVED';

export interface StatusConfig {
    label: string;
    color: string;        // Tailwind bg class
    textColor: string;    // Tailwind text class
    borderColor: string;  // Tailwind border class
    dotColor: string;     // Indicator dot color
    icon: string;         // Lucide icon name
    pulse: boolean;       // Animated indicator
    terminal: boolean;    // No further transitions
    description: string;
}

export const STATUS_MAP: Record<ClaimStatus, StatusConfig> = {
    DRAFT: {
        label: 'Draft',
        color: 'bg-zinc-100 dark:bg-zinc-800',
        textColor: 'text-zinc-700 dark:text-zinc-300',
        borderColor: 'border-zinc-300 dark:border-zinc-600',
        dotColor: '#A1A1AA',
        icon: 'FileEdit',
        pulse: false,
        terminal: false,
        description: 'Claim saved but not submitted',
    },
    SUBMITTED: {
        label: 'Submitted',
        color: 'bg-sky-50 dark:bg-sky-950',
        textColor: 'text-sky-700 dark:text-sky-300',
        borderColor: 'border-sky-300 dark:border-sky-700',
        dotColor: '#0284C7',
        icon: 'Send',
        pulse: false,
        terminal: false,
        description: 'Awaiting initial review',
    },
    UNDER_REVIEW: {
        label: 'Under Review',
        color: 'bg-amber-50 dark:bg-amber-950',
        textColor: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-300 dark:border-amber-700',
        dotColor: '#D97706',
        icon: 'Eye',
        pulse: true,
        terminal: false,
        description: 'Adjuster is reviewing',
    },
    FRAUD_CHECK: {
        label: 'Fraud Check',
        color: 'bg-orange-50 dark:bg-orange-950',
        textColor: 'text-orange-700 dark:text-orange-300',
        borderColor: 'border-orange-400 dark:border-orange-700',
        dotColor: '#EA580C',
        icon: 'ShieldAlert',
        pulse: true,
        terminal: false,
        description: 'Automated fraud scoring in progress',
    },
    APPROVED: {
        label: 'Approved',
        color: 'bg-emerald-50 dark:bg-emerald-950',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-400 dark:border-emerald-700',
        dotColor: '#059669',
        icon: 'CheckCircle2',
        pulse: false,
        terminal: false,
        description: 'Claim approved for payment',
    },
    REJECTED: {
        label: 'Rejected',
        color: 'bg-red-50 dark:bg-red-950',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-400 dark:border-red-700',
        dotColor: '#DC2626',
        icon: 'XCircle',
        pulse: false,
        terminal: false,
        description: 'Claim rejected — see reason',
    },
    INVESTIGATION: {
        label: 'Investigation',
        color: 'bg-rose-50 dark:bg-rose-950',
        textColor: 'text-rose-700 dark:text-rose-300',
        borderColor: 'border-rose-500 dark:border-rose-700',
        dotColor: '#E11D48',
        icon: 'AlertTriangle',
        pulse: true,
        terminal: false,
        description: 'Flagged for fraud investigation',
    },
    PAYMENT_PENDING: {
        label: 'Payment Pending',
        color: 'bg-teal-50 dark:bg-teal-950',
        textColor: 'text-teal-700 dark:text-teal-300',
        borderColor: 'border-teal-400 dark:border-teal-700',
        dotColor: '#0D9488',
        icon: 'Loader2',
        pulse: true,
        terminal: false,
        description: 'M-Pesa payment processing',
    },
    SETTLED: {
        label: 'Settled',
        color: 'bg-green-50 dark:bg-green-950',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-500 dark:border-green-700',
        dotColor: '#16A34A',
        icon: 'BadgeCheck',
        pulse: false,
        terminal: false,
        description: 'Payment received — claim settled',
    },
    DISPUTED: {
        label: 'Disputed',
        color: 'bg-yellow-50 dark:bg-yellow-950',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        borderColor: 'border-yellow-500 dark:border-yellow-600',
        dotColor: '#CA8A04',
        icon: 'Scale',
        pulse: true,
        terminal: false,
        description: 'Decision disputed by policyholder',
    },
    CLOSED: {
        label: 'Closed',
        color: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-300 dark:border-slate-600',
        dotColor: '#64748B',
        icon: 'FolderClosed',
        pulse: false,
        terminal: false,
        description: 'Claim closed — no further action',
    },
    ARCHIVED: {
        label: 'Archived',
        color: 'bg-neutral-100 dark:bg-neutral-900',
        textColor: 'text-neutral-500 dark:text-neutral-500',
        borderColor: 'border-neutral-300 dark:border-neutral-700',
        dotColor: '#737373',
        icon: 'Archive',
        pulse: false,
        terminal: true,
        description: 'Permanently archived — read-only',
    },
};

// Payment status mapping
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; color: string; textColor: string }> = {
    PENDING: { label: 'Pending', color: 'bg-zinc-100 dark:bg-zinc-800', textColor: 'text-zinc-600 dark:text-zinc-400' },
    PROCESSING: { label: 'Processing', color: 'bg-teal-50 dark:bg-teal-950', textColor: 'text-teal-700 dark:text-teal-300' },
    COMPLETED: { label: 'Completed', color: 'bg-green-50 dark:bg-green-950', textColor: 'text-green-700 dark:text-green-300' },
    FAILED: { label: 'Failed', color: 'bg-red-50 dark:bg-red-950', textColor: 'text-red-700 dark:text-red-300' },
    REVERSED: { label: 'Reversed', color: 'bg-amber-50 dark:bg-amber-950', textColor: 'text-amber-700 dark:text-amber-300' },
};

// OCR status mapping
export type OcrStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export const OCR_STATUS_MAP: Record<OcrStatus, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'bg-zinc-100 dark:bg-zinc-800' },
    PROCESSING: { label: 'Processing', color: 'bg-sky-50 dark:bg-sky-950' },
    COMPLETED: { label: 'Completed', color: 'bg-green-50 dark:bg-green-950' },
    FAILED: { label: 'Failed', color: 'bg-red-50 dark:bg-red-950' },
};
