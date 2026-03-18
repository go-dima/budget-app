import { Card, Statistic } from 'antd';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import type { AccountSummary } from '../../../shared/types.js';

interface AccountCardProps {
  account: AccountSummary;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      title={account.name}
      size="small"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {account.balance != null && (
          <div>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>Balance</span>
            <div><AmountDisplay amount={account.balance} /></div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>Income</span>
            <div><AmountDisplay amount={account.totalIncome} /></div>
          </div>
          <div>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>Expenses</span>
            <div><AmountDisplay amount={-account.totalExpenses} /></div>
          </div>
        </div>
        <Statistic title="Transactions" value={account.transactionCount} />
      </div>
    </Card>
  );
}
