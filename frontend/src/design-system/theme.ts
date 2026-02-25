// KlaimSwift Design System — Theme Configuration
// Enterprise Insurance UI — Regulatory, data-dense, trust-first

export const theme = {
    // Typography
    fonts: {
        heading: "'Inter', system-ui, -apple-system, sans-serif",
        body: "'Inter', system-ui, -apple-system, sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
    },

    // Type Scale (1.2 ratio — compact for data-dense UI)
    fontSize: {
        xs: '0.694rem',    // 11.1px
        sm: '0.833rem',    // 13.3px
        base: '0.875rem',  // 14px — dense default for dashboards
        md: '1rem',        // 16px
        lg: '1.2rem',      // 19.2px
        xl: '1.44rem',     // 23px
        '2xl': '1.728rem', // 27.6px
        '3xl': '2.074rem', // 33.2px
        '4xl': '2.488rem', // 39.8px
        hero: '3.583rem',  // 57.3px — landing page only
    },

    // Spacing (8px grid)
    spacing: {
        px: '1px',
        0.5: '2px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
    },

    // Border Radius — Sharp for enterprise (not rounded-friendly)
    radius: {
        none: '0px',
        sm: '2px',      // Subtle rounding
        DEFAULT: '4px', // Standard
        md: '6px',      // Cards, inputs
        lg: '8px',      // Modals, panels
        // Intentionally no xl/2xl/full — sharp aesthetic
    },

    // Elevation (subtle, not floaty)
    shadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },

    // Transitions
    transition: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Breakpoints
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    // Z-index
    zIndex: {
        dropdown: 50,
        modal: 100,
        toast: 200,
        tooltip: 300,
    },
} as const;

// Role-based navigation configuration
export type UserRole =
    | 'POLICYHOLDER'
    | 'CLAIMS_ADJUSTER'
    | 'FRAUD_ANALYST'
    | 'ACTUARY'
    | 'ADMIN'
    | 'REGULATOR';

export interface NavItem {
    label: string;
    href: string;
    icon: string;
    roles: UserRole[];
}

export const NAVIGATION: NavItem[] = [
    // Policyholder
    { label: 'My Claims', href: '/dashboard/claims', icon: 'FileStack', roles: ['POLICYHOLDER'] },
    { label: 'Submit Claim', href: '/dashboard/claims/new', icon: 'FilePlus2', roles: ['POLICYHOLDER'] },
    { label: 'Payments', href: '/dashboard/payments', icon: 'Wallet', roles: ['POLICYHOLDER'] },

    // Adjuster
    { label: 'Claims Queue', href: '/dashboard/claims', icon: 'Inbox', roles: ['CLAIMS_ADJUSTER'] },
    { label: 'Assigned to Me', href: '/dashboard/claims?assigned=me', icon: 'UserCheck', roles: ['CLAIMS_ADJUSTER'] },

    // Fraud Analyst
    { label: 'Fraud Dashboard', href: '/dashboard/fraud', icon: 'ShieldAlert', roles: ['FRAUD_ANALYST'] },
    { label: 'Investigation Queue', href: '/dashboard/fraud/investigations', icon: 'Search', roles: ['FRAUD_ANALYST'] },

    // Actuary
    { label: 'Actuarial Metrics', href: '/dashboard/analytics/actuarial', icon: 'BarChart3', roles: ['ACTUARY'] },
    { label: 'Loss Ratios', href: '/dashboard/analytics/loss-ratios', icon: 'TrendingDown', roles: ['ACTUARY'] },

    // Admin
    { label: 'All Claims', href: '/dashboard/claims', icon: 'LayoutList', roles: ['ADMIN'] },
    { label: 'User Management', href: '/dashboard/admin/users', icon: 'Users', roles: ['ADMIN'] },
    { label: 'Fraud Analytics', href: '/dashboard/fraud', icon: 'ShieldAlert', roles: ['ADMIN'] },
    { label: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3', roles: ['ADMIN'] },
    { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: 'FileText', roles: ['ADMIN'] },
    { label: 'Ledger Verification', href: '/dashboard/admin/ledger', icon: 'Link2', roles: ['ADMIN'] },
    { label: 'Payments', href: '/dashboard/payments', icon: 'Wallet', roles: ['ADMIN'] },

    // Regulator
    { label: 'Audit Trail', href: '/dashboard/admin/audit-logs', icon: 'FileText', roles: ['REGULATOR'] },
    { label: 'Compliance', href: '/dashboard/analytics', icon: 'Shield', roles: ['REGULATOR'] },
];

// KES currency formatter
export function formatKES(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
}

// Kenyan phone formatter
export function formatPhone(phone: string): string {
    if (phone.startsWith('+254')) {
        return `+254 ${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`;
    }
    return phone;
}

// Date formatter (Kenyan locale)
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
