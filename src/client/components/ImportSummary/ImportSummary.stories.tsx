import type { Meta, StoryObj } from '@storybook/react';
import { ImportSummary } from './ImportSummary.js';

const meta: Meta<typeof ImportSummary> = { component: ImportSummary, title: 'Components/ImportSummary' };
export default meta;
type Story = StoryObj<typeof ImportSummary>;

export const Success: Story = {
  args: {
    result: {
      success: true,
      results: [
        { sheetName: 'Leumi', accountName: 'Bank Leumi', newTransactions: 312, duplicatesSkipped: 5, error: null },
        { sheetName: 'Cal', accountName: 'Visa Cal', newTransactions: 198, duplicatesSkipped: 0, error: null },
      ],
      totalNew: 510,
      totalSkipped: 5,
      transactionsForReview: [],
    },
    onGoToOverview: () => {},
    onImportMore: () => {},
  },
};
