import type { ReactNode } from 'react';
import { Tabs, Typography } from 'antd';

interface AccountTabsProps {
  accounts: string[];
  renderContent: (account: string) => ReactNode;
  emptyText?: string;
}

export function AccountTabs({
  accounts,
  renderContent,
  emptyText = 'No mappings yet. Import some transactions and click Re-calculate.',
}: AccountTabsProps) {
  if (accounts.length === 0) {
    return <Typography.Text type="secondary">{emptyText}</Typography.Text>;
  }

  return (
    <Tabs
      items={accounts.map(account => ({
        key: account,
        label: account,
        children: renderContent(account),
      }))}
    />
  );
}
