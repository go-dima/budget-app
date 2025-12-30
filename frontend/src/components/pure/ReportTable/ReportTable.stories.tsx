import type { Meta, StoryObj } from "@storybook/react";
import { ReportTable } from "./ReportTable";
import type { AggregatedReportItem } from "../../../types";

const mockMonthlyData: AggregatedReportItem[] = [
  {
    period: "2024-12",
    income: 15000,
    expense: 8500,
    net_balance: 6500,
    transaction_count: 45,
  },
  {
    period: "2024-11",
    income: 15000,
    expense: 12000,
    net_balance: 3000,
    transaction_count: 52,
  },
  {
    period: "2024-10",
    income: 16000,
    expense: 18000,
    net_balance: -2000,
    transaction_count: 48,
  },
];

const mockCategoryData: AggregatedReportItem[] = [
  {
    period: "Groceries",
    income: 0,
    expense: 3500,
    net_balance: -3500,
    transaction_count: 25,
  },
  {
    period: "Salary",
    income: 45000,
    expense: 0,
    net_balance: 45000,
    transaction_count: 3,
  },
  {
    period: "Utilities",
    income: 0,
    expense: 1200,
    net_balance: -1200,
    transaction_count: 8,
  },
];

const meta: Meta<typeof ReportTable> = {
  title: "Components/ReportTable",
  component: ReportTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ByMonth: Story = {
  args: {
    data: mockMonthlyData,
    groupBy: "month",
  },
};

export const ByCategory: Story = {
  args: {
    data: mockCategoryData,
    groupBy: "category",
  },
};

export const Loading: Story = {
  args: {
    data: [],
    groupBy: "month",
    loading: true,
  },
};
