import type { Meta, StoryObj } from '@storybook/react';
import { AccountCard } from './AccountCard.js';

const meta: Meta<typeof AccountCard> = { component: AccountCard, title: 'Components/AccountCard' };
export default meta;
type Story = StoryObj<typeof AccountCard>;

export const Default: Story = {
  args: {
    account: { id: '1', name: 'Bank Leumi Checking', balance: 1500000, totalIncome: 2000000, totalExpenses: 500000, transactionCount: 42, latestDate: '2026-03-15' },
  },
};
