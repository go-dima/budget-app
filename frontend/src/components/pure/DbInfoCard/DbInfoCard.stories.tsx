import type { Meta, StoryObj } from "@storybook/react";
import { DbInfoCard } from "./DbInfoCard";

const meta: Meta<typeof DbInfoCard> = {
  title: "Components/DbInfoCard",
  component: DbInfoCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    database: {
      account_id: "acc-1",
      account_name: "Main Account",
      db_path: "/data/main_account.db",
      transaction_count: 1250,
      last_transaction_date: Math.floor(Date.now() / 1000),
    },
  },
};

export const NoTransactions: Story = {
  args: {
    database: {
      account_id: "acc-2",
      account_name: "New Account",
      db_path: "/data/new_account.db",
      transaction_count: 0,
      last_transaction_date: null,
    },
  },
};
