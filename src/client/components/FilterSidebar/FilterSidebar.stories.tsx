import type { Meta, StoryObj } from '@storybook/react';
import { FilterSidebar } from './FilterSidebar.js';
import { MemoryRouter } from 'react-router-dom';

const meta: Meta<typeof FilterSidebar> = {
  component: FilterSidebar,
  title: 'Components/FilterSidebar',
  decorators: [Story => <MemoryRouter><Story /></MemoryRouter>],
};
export default meta;
type Story = StoryObj<typeof FilterSidebar>;

export const Default: Story = {
  args: {
    filters: { startDate: '2025-01-01', endDate: '2025-12-31', type: 'all', excludeCategories: ['2'] },
    accounts: [{ id: '1', name: 'Bank Leumi', type: 'checking', currency: 'ILS', createdAt: 0 }],
    categories: [
      { id: '1', name: 'מזון', type: 'expense', excludedByDefault: false },
      { id: '2', name: 'הכנסות', type: 'income', excludedByDefault: true },
    ],
    onSetAccountIds: () => {},
    onSetExcludeCategories: () => {},
    onSetDateRange: () => {},
    onSetType: () => {},
    onReset: () => {},
    drawerOpen: true,
  },
};
