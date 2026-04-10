import type { Meta, StoryObj } from '@storybook/react';
import { ColumnMappingStep } from './ColumnMappingStep.js';

const meta: Meta<typeof ColumnMappingStep> = {
  title: 'Components/ColumnMappingStep',
  component: ColumnMappingStep,
  args: {
    onConfirm: (mapping) => console.log('Confirmed mapping', mapping),
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof ColumnMappingStep>;

export const NoStoredMapping: Story = {
  args: {
    sheets: [
      {
        sheetName: 'MyBank',
        unknownColumns: ['בחובה', 'בזכות', 'יתרה'],
        storedMapping: null,
      },
    ],
  },
};

export const WithStoredMapping: Story = {
  args: {
    sheets: [
      {
        sheetName: 'MyBank',
        unknownColumns: ['בחובה', 'בזכות', 'יתרה'],
        storedMapping: [
          { sourceColumn: 'בחובה', targetField: 'expense' },
          { sourceColumn: 'בזכות', targetField: 'income' },
          { sourceColumn: 'יתרה', targetField: 'balance' },
        ],
      },
    ],
  },
};

export const MultipleSheets: Story = {
  args: {
    sheets: [
      {
        sheetName: 'Checking',
        unknownColumns: ['Debit', 'Credit'],
        storedMapping: null,
      },
      {
        sheetName: 'Savings',
        unknownColumns: ['Amount', 'Running Balance'],
        storedMapping: [
          { sourceColumn: 'Amount', targetField: 'expense' },
          { sourceColumn: 'Running Balance', targetField: 'balance' },
        ],
      },
    ],
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    sheets: [
      {
        sheetName: 'MyBank',
        unknownColumns: ['בחובה', 'בזכות', 'יתרה'],
        storedMapping: [
          { sourceColumn: 'בחובה', targetField: 'expense' },
          { sourceColumn: 'בזכות', targetField: 'income' },
          { sourceColumn: 'יתרה', targetField: 'balance' },
        ],
      },
    ],
  },
};
