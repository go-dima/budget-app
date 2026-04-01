import { useMemo } from 'react';

const _fmt = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Format an agorot integer as a ₪ string (no colour, no sign). */
export function formatAmount(agorot: number): string {
  return `₪${_fmt.format(Math.abs(agorot) / 100)}`;
}

interface AmountDisplayProps {
  amount: number;
  showSign?: boolean;
  className?: string;
}

export function AmountDisplay({ amount, showSign = false, className }: AmountDisplayProps) {
  const { formatted, color } = useMemo(() => {
    const display = formatAmount(amount);
    const withSign = showSign && amount !== 0 ? (amount > 0 ? `+${display}` : `-${display}`) : display;
    const color = amount > 0 ? '#52c41a' : amount < 0 ? '#ff4d4f' : '#8c8c8c';
    return { formatted: withSign, color };
  }, [amount, showSign]);

  return <span className={className} style={{ color, fontWeight: 500 }}>{formatted}</span>;
}
