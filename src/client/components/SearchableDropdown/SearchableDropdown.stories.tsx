import type { Meta, StoryObj } from '@storybook/react';
import { SearchableDropdown } from './SearchableDropdown.js';

const meta: Meta<typeof SearchableDropdown> = {
  component: SearchableDropdown,
  title: 'Components/SearchableDropdown',
};
export default meta;
type Story = StoryObj<typeof SearchableDropdown>;

const options = [
  { value: 'cat-1', label: 'Groceries' },
  { value: 'cat-2', label: 'Dining' },
  { value: 'cat-3', label: 'Transport' },
  { value: 'cat-4', label: 'Salary' },
];

export const Empty: Story = {
  args: { value: null, options, placeholder: 'Select category', onChange: () => {} },
};

export const WithValue: Story = {
  args: { value: 'cat-1', options, onChange: () => {}, onClear: () => {} },
};

export const GroupedOptions: Story = {
  args: {
    value: null,
    options: [
      { label: 'Preferred', options: [{ value: 'cat-2', label: 'Dining' }] },
      { label: 'Suggested', options: [{ value: 'cat-3', label: 'Transport' }] },
      { label: 'All', options: [{ value: 'cat-1', label: 'Groceries' }, { value: 'cat-4', label: 'Salary' }] },
    ],
    onChange: () => {},
  },
};

export const AllowCreate: Story = {
  args: {
    value: null,
    options: [{ value: 'credit', label: 'Credit Card' }, { value: 'cash', label: 'Cash' }],
    placeholder: 'Select or type...',
    allowCreate: true,
    onChange: () => {},
  },
};
