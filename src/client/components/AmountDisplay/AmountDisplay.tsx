import { useMemo } from 'react';

interface AmountDisplayProps {
  amount: number;
  showSign?: boolean;
  className?: string;
}

export function AmountDisplay({ amount, showSign = false, className }: AmountDisplayProps) {
  const { formatted, color } = useMemo(() => {
    const abs = Math.abs(amount) / 100;
    const formatted = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
    const display = `₪${formatted}`;
    const withSign = showSign && amount !== 0 ? (amount > 0 ? `+${display}` : `-${display}`) : display;
    const color = amount > 0 ? '#52c41a' : amount < 0 ? '#ff4d4f' : '#8c8c8c';
    return { formatted: withSign, color };
  }, [amount, showSign]);

  return <span className={className} style={{ color, fontWeight: 500 }}>{formatted}</span>;
}
