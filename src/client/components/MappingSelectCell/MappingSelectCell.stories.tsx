import type { Meta, StoryObj } from '@storybook/react';
import { MappingSelectCell } from './MappingSelectCell.js';

const OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'cash', label: 'Cash' },
];

const meta: Meta<typeof MappingSelectCell> = {
  component: MappingSelectCell,
  title: 'Components/MappingSelectCell',
};
export default meta;

type Story = StoryObj<typeof MappingSelectCell>;

export const WithValue: Story = {
  args: {
    value: 'visa',
    valueLabel: 'Visa',
    options: OPTIONS,
    onSave: () => {},
  },
};

export const NoValue: Story = {
  args: {
    value: null,
    options: OPTIONS,
    onSave: () => {},
  },
};

export const CustomPlaceholder: Story = {
  args: {
    value: null,
    options: OPTIONS,
    placeholder: 'Select payment method',
    onSave: () => {},
  },
};
