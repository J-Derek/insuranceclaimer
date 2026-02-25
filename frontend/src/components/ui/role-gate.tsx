'use client';

import { useAuthStore } from '@/stores/auth-store';
import type { UserRole } from '@/design-system/theme';

interface RoleGateProps {
    roles: UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
    const user = useAuthStore((s) => s.user);

    if (!user) return null;
    if (!roles.includes(user.role as UserRole)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
