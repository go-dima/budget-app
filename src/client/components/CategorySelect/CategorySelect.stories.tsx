import type { Meta, StoryObj } from '@storybook/react';
import { CategorySelect } from './CategorySelect.js';

const meta: Meta<typeof CategorySelect> = {
  component: CategorySelect,
  title: 'Components/CategorySelect',
};
export default meta;
type Story = StoryObj<typeof CategorySelect>;

const options = [
  { value: 'cat-1', label: 'Groceries' },
  { value: 'cat-2', label: 'Dining' },
  { value: 'cat-3', label: 'Transport' },
  { value: 'cat-4', label: 'Salary' },
];

export const Empty: Story = {
  args: {
    value: null,
    options,
    placeholder: 'Select category',
    onChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    value: 'cat-1',
    options,
    onChange: () => {},
    onClear: () => {},
  },
};

export const CustomPlaceholder: Story = {
  args: {
    value: null,
    options,
    placeholder: 'Choose a category...',
    onChange: () => {},
  },
};

export const GroupedOptions: Story = {
  args: {
    value: null,
    options: [
      {
        label: 'Preferred',
        options: [{ value: 'cat-2', label: 'Dining' }],
      },
      {
        label: 'Suggested',
        options: [{ value: 'cat-3', label: 'Transport' }],
      },
      {
        label: 'All',
        options: [
          { value: 'cat-1', label: 'Groceries' },
          { value: 'cat-4', label: 'Salary' },
        ],
      },
    ],
    onChange: () => {},
  },
};
