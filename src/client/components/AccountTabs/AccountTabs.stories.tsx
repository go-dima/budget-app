import type { Meta, StoryObj } from '@storybook/react';
import { AccountTabs } from './AccountTabs.js';

const meta: Meta<typeof AccountTabs> = {
  component: AccountTabs,
  title: 'Components/AccountTabs',
};
export default meta;

type Story = StoryObj<typeof AccountTabs>;

export const WithAccounts: Story = {
  args: {
    accounts: ['Checking', 'Credit Card', 'Savings'],
    renderContent: (account) => <div>Content for {account}</div>,
  },
};

export const Empty: Story = {
  args: {
    accounts: [],
    renderContent: () => null,
  },
};

export const EmptyCustomText: Story = {
  args: {
    accounts: [],
    renderContent: () => null,
    emptyText: 'No accounts found.',
  },
};
