import type { Meta, StoryObj } from '@storybook/react';
import { DbStatusTable } from './DbStatusTable.js';

const meta: Meta<typeof DbStatusTable> = { component: DbStatusTable, title: 'Components/DbStatusTable' };
export default meta;
type Story = StoryObj<typeof DbStatusTable>;

export const WithData: Story = {
  args: {
    status: {
      accounts: [
        { accountId: '1', accountName: 'Bank Leumi', transactionCount: 1247, latestDate: '2026-02-28' },
        { accountId: '2', accountName: 'Visa Cal', transactionCount: 834, latestDate: '2026-03-01' },
      ],
      totalTransactions: 2081,
    },
    onReset: () => {},
  },
};
export const Empty: Story = { args: { status: { accounts: [], totalTransactions: 0 }, onReset: () => {} } };
