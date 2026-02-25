'use client';

interface StatCardProps {
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: React.ReactNode;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon }: StatCardProps) {
    const changeColor = {
        positive: 'text-emerald-600 dark:text-emerald-400',
        negative: 'text-red-600 dark:text-red-400',
        neutral: 'text-zinc-500 dark:text-zinc-400',
    }[changeType];

    return (
        <div className="card group transition-all duration-150 hover:border-[#0D7377]/30 dark:hover:border-teal-700/50">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {value}
                    </p>
                    {change && (
                        <p className={`text-[12px] font-medium mt-1 ${changeColor}`}>
                            {change}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-[#0D7377]/10 group-hover:text-[#0D7377] dark:group-hover:bg-teal-900/30 dark:group-hover:text-teal-300 transition-colors">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
