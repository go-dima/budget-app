import type { Meta, StoryObj } from '@storybook/react';
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { MappingPage } from './MappingPage.js';
import { MappingSelectCell } from '../MappingSelectCell/MappingSelectCell.js';
import { SuggestedChips } from '../SuggestedChips/SuggestedChips.js';

interface SampleRow {
  account: string;
  description: string;
  preferredValue: string | null;
  suggested: string[];
}

const sampleData: SampleRow[] = [
  { account: 'Bank A', description: 'סופרמרקט', preferredValue: 'food', suggested: ['groceries'] },
  { account: 'Bank A', description: 'דלק', preferredValue: null, suggested: ['fuel', 'transport'] },
  { account: 'Bank B', description: 'נטפליקס', preferredValue: 'entertainment', suggested: [] },
];

const valueOptions = [
  { value: 'food', label: 'Food' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'transport', label: 'Transport' },
  { value: 'entertainment', label: 'Entertainment' },
];

const tableColumns = [
  { title: 'Description', dataIndex: 'description', key: 'description' },
  {
    title: 'Preferred',
    key: 'preferred',
    render: (_: unknown, record: SampleRow) => (
      <MappingSelectCell
        value={record.preferredValue}
        options={valueOptions}
        onSave={() => {}}
      />
    ),
  },
  {
    title: 'Suggested',
    key: 'suggested',
    render: (_: unknown, record: SampleRow) => (
      <SuggestedChips
        items={record.suggested.map(s => ({ key: s, label: s }))}
        canRemove
        onSelect={() => {}}
        onRemove={() => {}}
      />
    ),
  },
  {
    title: '',
    key: 'delete',
    width: 48,
    render: () => <Button icon={<DeleteOutlined />} danger />,
  },
];

const meta: Meta<typeof MappingPage<SampleRow>> = {
  title: 'Components/MappingPage',
  component: MappingPage,
  args: {
    data: sampleData,
    isLoading: false,
    error: null,
    tableColumns,
    getValueOptions: () => valueOptions,
    valuePlaceholder: 'Category',
    onRecalculate: async () => ({ updated: 3, conflicts: 1, noops: 5 }),
    onReloadData: () => {},
    onAdd: async () => {},
  },
};

export default meta;
type Story = StoryObj<typeof MappingPage<SampleRow>>;

export const Default: Story = {
  args: { title: 'Category Mapping' },
};

export const Loading: Story = {
  args: { title: 'Category Mapping', isLoading: true },
};

export const WithError: Story = {
  args: {
    title: 'Category Mapping',
    error: new Error('Failed to load mappings'),
  },
};

export const Empty: Story = {
  args: { title: 'Category Mapping', data: [] },
};
