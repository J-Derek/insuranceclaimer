'use client';

import { STATUS_MAP, type ClaimStatus } from '@/design-system/status-mapping';

interface StatusBadgeProps {
    status: ClaimStatus;
    size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_MAP[status];
    if (!config) return <span className="badge">{status}</span>;

    return (
        <span
            className={`
        badge ${config.color} ${config.textColor} border ${config.borderColor}
        ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''}
      `}
        >
            <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${config.pulse ? 'status-pulse' : ''}`}
                style={{ backgroundColor: config.dotColor }}
            />
            {config.label}
        </span>
    );
}
