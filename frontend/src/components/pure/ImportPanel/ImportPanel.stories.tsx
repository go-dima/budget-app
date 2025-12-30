import type { Meta, StoryObj } from "@storybook/react";
import { ImportPanel } from "./ImportPanel";

const meta: Meta<typeof ImportPanel> = {
  title: "Components/ImportPanel",
  component: ImportPanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onImport: async () => ({
      accounts_created: 2,
      transactions_imported: 150,
      last_transaction_date: Math.floor(Date.now() / 1000),
      errors: [],
    }),
  },
};

export const Importing: Story = {
  args: {
    onImport: async () => ({
      accounts_created: 0,
      transactions_imported: 0,
      last_transaction_date: null,
      errors: [],
    }),
    isImporting: true,
  },
};

export const WithResult: Story = {
  args: {
    onImport: async () => ({
      accounts_created: 2,
      transactions_imported: 150,
      last_transaction_date: Math.floor(Date.now() / 1000),
      errors: [],
    }),
    lastResult: {
      accounts_created: 2,
      transactions_imported: 150,
      last_transaction_date: Math.floor(Date.now() / 1000),
      errors: [],
    },
  },
};

export const WithErrors: Story = {
  args: {
    onImport: async () => ({
      accounts_created: 1,
      transactions_imported: 100,
      last_transaction_date: Math.floor(Date.now() / 1000),
      errors: ["Failed to parse sheet 'Sheet2': Invalid date format"],
    }),
    lastResult: {
      accounts_created: 1,
      transactions_imported: 100,
      last_transaction_date: Math.floor(Date.now() / 1000),
      errors: ["Failed to parse sheet 'Sheet2': Invalid date format"],
    },
  },
};
