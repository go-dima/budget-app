import { Card, Statistic } from 'antd';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import type { AccountSummary } from '../../../shared/types.js';
import styles from './AccountCard.module.css';

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
      <div className={styles.body}>
        {account.balance != null && (
          <div>
            <span className="stat-label">Balance</span>
            <div><AmountDisplay amount={account.balance} /></div>
          </div>
        )}
        <div className={styles.statRow}>
          <div>
            <span className="stat-label">Income</span>
            <div><AmountDisplay amount={account.totalIncome} /></div>
          </div>
          <div>
            <span className="stat-label">Expenses</span>
            <div><AmountDisplay amount={-account.totalExpenses} /></div>
          </div>
        </div>
        <Statistic title="Transactions" value={account.transactionCount} />
        {account.latestDate && (
          <div>
            <span className="stat-label">Last transaction</span>
            <div className="text-body-sm">{account.latestDate}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
