import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxList } from './CheckboxList.js';

const meta: Meta<typeof CheckboxList> = {
  component: CheckboxList,
  title: 'Components/CheckboxList',
};
export default meta;
type Story = StoryObj<typeof CheckboxList>;

const sampleAccounts = [
  { id: '1', name: 'Bank Leumi' },
  { id: '2', name: 'Discount' },
  { id: '3', name: 'Poalim' },
];

const sampleCategories = [
  { id: '1', name: 'מזון' },
  { id: '2', name: 'תחבורה' },
  { id: '3', name: 'הכנסות' },
];

export const IncludeMode: Story = {
  args: {
    items: sampleAccounts,
    mode: 'include',
    selectedIds: [],
    onChange: () => {},
  },
};

export const ExcludeMode: Story = {
  args: {
    items: sampleCategories,
    mode: 'exclude',
    excludeIds: ['2'],
    onChangeExclude: () => {},
    rtl: true,
  },
};
