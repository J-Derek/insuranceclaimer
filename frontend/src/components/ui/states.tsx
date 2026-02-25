'use client';

export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {icon && (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                    {icon}
                </div>
            )}
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
            {description && (
                <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-500 max-w-sm">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 flex-1" />
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-4 w-16" />
                </div>
            ))}
        </div>
    );
}

export function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
}: {
    title?: string;
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950 text-red-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
            {message && (
                <p className="mt-1 text-[13px] text-zinc-500 max-w-sm">{message}</p>
            )}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 rounded bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-[13px] font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

export function ForbiddenState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Access Denied</h3>
            <p className="mt-1 text-[13px] text-zinc-500 max-w-sm">
                You do not have permission to view this page. Contact your administrator.
            </p>
        </div>
    );
}
