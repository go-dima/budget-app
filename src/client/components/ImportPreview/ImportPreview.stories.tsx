import type { Meta, StoryObj } from '@storybook/react';
import { ImportPreview } from './ImportPreview.js';

const meta: Meta<typeof ImportPreview> = { component: ImportPreview, title: 'Components/ImportPreview' };
export default meta;
type Story = StoryObj<typeof ImportPreview>;

export const Default: Story = {
  args: {
    preview: {
      fileId: 'test-id',
      suggestFixBidi: false,
      sheets: [{
        sheetName: 'Bank Leumi',
        rowCount: 312,
        dateRange: { from: '2025-01-01', to: '2025-12-31' },
        sampleRows: [{ date: '2025-01-15', description: 'סופרמרקט', category: 'מזון', amount: -30000 }],
        existingAccount: { accountId: '1', newRows: 312, duplicates: 5 },
        error: null,
        unknownColumns: null,
        storedColumnMapping: null,
        rawRows: null,
        detectedHeaderRow: 0,
      }],
    },
    onConfirm: () => {},
    isLoading: false,
  },
};
