import type { Meta, StoryObj } from '@storybook/react';
import { CategoryReview } from './CategoryReview.js';
import type { Category, ImportedTransactionReview } from '../../../shared/types.js';

const meta: Meta<typeof CategoryReview> = {
  component: CategoryReview,
  title: 'Components/CategoryReview',
};
export default meta;
type Story = StoryObj<typeof CategoryReview>;

const categories: Category[] = [
  { id: 'cat-1', name: 'Groceries', type: 'expense', excludedByDefault: false },
  { id: 'cat-2', name: 'Dining', type: 'expense', excludedByDefault: false },
  { id: 'cat-3', name: 'Transport', type: 'expense', excludedByDefault: false },
  { id: 'cat-4', name: 'Salary', type: 'income', excludedByDefault: false },
];

const PM_DEFAULTS = { paymentMethod: null, preferredPaymentMethod: null, suggestedPaymentMethods: [] };

const autoCategorizedTransactions: ImportedTransactionReview[] = [
  { id: 'tx-1', accountName: 'Bank Leumi', date: '2024-01-15', description: 'שופרסל דיל', amount: -4500, categoryId: 'cat-1', categoryName: 'Groceries', autoAssigned: true, preferredCategoryId: 'cat-1', suggestedCategoryIds: [], ...PM_DEFAULTS },
  { id: 'tx-2', accountName: 'Bank Leumi', date: '2024-01-16', description: 'מקדונלדס', amount: -3200, categoryId: 'cat-2', categoryName: 'Dining', autoAssigned: true, preferredCategoryId: 'cat-2', suggestedCategoryIds: [], ...PM_DEFAULTS },
  { id: 'tx-3', accountName: 'Bank Leumi', date: '2024-01-17', description: 'רב-קו', amount: -1600, categoryId: 'cat-3', categoryName: 'Transport', autoAssigned: true, preferredCategoryId: 'cat-3', suggestedCategoryIds: ['cat-1'], paymentMethod: 'Credit Card', preferredPaymentMethod: 'Credit Card', suggestedPaymentMethods: ['Cash'] },
];

const uncategorizedTransactions: ImportedTransactionReview[] = [
  { id: 'tx-4', accountName: 'Visa Cal', date: '2024-01-18', description: 'העברה בנקאית', amount: -25000, categoryId: null, categoryName: null, autoAssigned: false, preferredCategoryId: null, suggestedCategoryIds: [], ...PM_DEFAULTS },
  { id: 'tx-5', accountName: 'Visa Cal', date: '2024-01-19', description: 'פייפאל', amount: -8900, categoryId: null, categoryName: null, autoAssigned: false, preferredCategoryId: null, suggestedCategoryIds: ['cat-2', 'cat-3'], ...PM_DEFAULTS },
];

export const AutoCategorized: Story = {
  args: {
    transactions: autoCategorizedTransactions,
    categories,
    onSave: () => {},
    isLoading: false,
  },
};

export const Uncategorized: Story = {
  args: {
    transactions: uncategorizedTransactions,
    categories,
    onSave: () => {},
    isLoading: false,
  },
};

export const Mixed: Story = {
  args: {
    transactions: [...autoCategorizedTransactions, ...uncategorizedTransactions],
    categories,
    onSave: () => {},
    isLoading: false,
  },
};
