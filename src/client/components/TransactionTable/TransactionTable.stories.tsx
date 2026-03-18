import type { Meta, StoryObj } from '@storybook/react';
import { TransactionTable } from './TransactionTable.js';

const meta: Meta<typeof TransactionTable> = { component: TransactionTable, title: 'Components/TransactionTable' };
export default meta;
type Story = StoryObj<typeof TransactionTable>;

const sampleTxns = [
  { id: '1', accountId: 'a1', accountName: 'Bank Leumi', categoryId: 'c1', categoryName: 'מזון', amount: -30000, type: 'expense' as const, description: 'סופרמרקט', paymentMethod: 'credit', details: null, reference: '123', balance: 500000, date: '2025-01-15', createdAt: 0 },
  { id: '2', accountId: 'a1', accountName: 'Bank Leumi', categoryId: null, categoryName: null, amount: 1000000, type: 'income' as const, description: 'משכורת', paymentMethod: null, details: null, reference: '456', balance: 1500000, date: '2025-01-01', createdAt: 0 },
];

export const Default: Story = {
  args: { transactions: sampleTxns, total: 2, page: 1, pageSize: 50, isLoading: false, onPageChange: () => {}, onSort: () => {}, onSearch: () => {} },
};
export const Loading: Story = {
  args: { transactions: [], total: 0, page: 1, pageSize: 50, isLoading: true, onPageChange: () => {}, onSort: () => {}, onSearch: () => {} },
};
