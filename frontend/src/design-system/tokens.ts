// KlaimSwift Design System — Semantic Color Tokens
// Enterprise insurance platform — regulated, data-dense, trust-first

export const colors = {
    // Brand — Deep Teal + Signal Orange (no purple, no fintech blue)
    brand: {
        primary: '#0D7377',      // Deep Teal — trust, stability, regulation
        primaryHover: '#0A5E61',
        primaryMuted: '#0D73771A', // 10% opacity
        accent: '#E86830',        // Signal Orange — action, urgency, attention
        accentHover: '#D15A25',
        accentMuted: '#E868301A',
    },

    // Semantic
    success: {
        DEFAULT: '#059669',
        muted: '#059669/10',
        text: '#047857',
        border: '#059669/30',
        bg: '#ECFDF5',
        bgDark: '#064E3B',
    },
    warning: {
        DEFAULT: '#D97706',
        muted: '#D97706/10',
        text: '#B45309',
        border: '#D97706/30',
        bg: '#FFFBEB',
        bgDark: '#78350F',
    },
    danger: {
        DEFAULT: '#DC2626',
        muted: '#DC2626/10',
        text: '#B91C1C',
        border: '#DC2626/30',
        bg: '#FEF2F2',
        bgDark: '#7F1D1D',
    },
    info: {
        DEFAULT: '#0284C7',
        muted: '#0284C7/10',
        text: '#0369A1',
        border: '#0284C7/30',
        bg: '#F0F9FF',
        bgDark: '#0C4A6E',
    },

    // Surfaces — Light Mode
    light: {
        background: '#FAFAFA',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        surfaceMuted: '#F4F4F5',
        border: '#E4E4E7',
        borderStrong: '#D4D4D8',
        text: '#09090B',
        textSecondary: '#71717A',
        textMuted: '#A1A1AA',
    },

    // Surfaces — Dark Mode
    dark: {
        background: '#09090B',
        surface: '#18181B',
        surfaceElevated: '#27272A',
        surfaceMuted: '#27272A',
        border: '#3F3F46',
        borderStrong: '#52525B',
        text: '#FAFAFA',
        textSecondary: '#A1A1AA',
        textMuted: '#71717A',
    },
} as const;

// Risk Level Color Mapping (Fraud Engine)
export const riskColors = {
    CRITICAL: { bg: '#7F1D1D', text: '#FCA5A5', border: '#DC2626', dot: '#EF4444' },
    HIGH: { bg: '#7C2D12', text: '#FDBA74', border: '#EA580C', dot: '#F97316' },
    MEDIUM: { bg: '#78350F', text: '#FDE68A', border: '#D97706', dot: '#F59E0B' },
    LOW: { bg: '#064E3B', text: '#6EE7B7', border: '#059669', dot: '#10B981' },
} as const;

export type RiskLevel = keyof typeof riskColors;
