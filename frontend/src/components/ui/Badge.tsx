import type { BadgeProps } from '../../types/landing';

export const Badge = ({ bg = '#ffffff', children, className }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold ${className ?? ''}`}
    style={{
      background: bg,
      border: 'var(--border)',
      boxShadow: 'var(--shadow-sm)',
      borderRadius: 0,
      fontFamily: 'var(--font-body)',
      color: 'var(--primary)',
    }}
  >
    {children}
  </span>
);

export default Badge;
