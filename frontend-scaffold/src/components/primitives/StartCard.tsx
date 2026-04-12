import React from 'react';

interface ChangeProps {
  value: number;
  positive: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: ChangeProps;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  change,
  className = '',
}) => {
  const isPositive = change?.positive ?? false;
  const changeValue = Math.abs(change?.value ?? 0);
  const formattedChange = `${isPositive ? '+' : '-'}${changeValue}%`;

  return (
    <div
      className={`
        bg-white dark:bg-zinc-950 
        border-4 border-black dark:border-white 
        p-6 
        shadow-none
        hover:border-zap-bg-alt dark:hover:border-zinc-300
        transition-colors duration-200
        flex flex-col
        ${className}
      `}
    >
      {/* Label + Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-mono uppercase tracking-[3px] text-zinc-500 dark:text-zinc-400 font-bold">
          {label}
        </div>
        
        {icon && <div className="text-3xl">{icon}</div>}
      </div>

      {/* Value */}
      <div className="text-5xl font-black tracking-tighter text-black dark:text-white mb-4">
        {value}
      </div>

      {/* Change Indicator */}
      {change && (
        <div
          className={`flex items-center gap-2 text-sm font-semibold ${
            isPositive 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          <span className="text-xl">
            {isPositive ? '↑' : '↓'}
          </span>
          <span>{formattedChange}</span>
          <span className="text-zinc-400 font-normal text-xs">from last period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;