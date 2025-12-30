import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SummaryCard } from "../../src/components/pure/SummaryCard/SummaryCard";

describe("SummaryCard", () => {
  it("renders title correctly", () => {
    render(
      <SummaryCard
        title="Test Account"
        totalIncome={1000}
        totalExpense={500}
        balance={500}
      />
    );
    expect(screen.getByText("Test Account")).toBeInTheDocument();
  });

  it("renders income, expense, and balance labels", () => {
    render(
      <SummaryCard
        title="Test"
        totalIncome={1000}
        totalExpense={500}
        balance={500}
      />
    );
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("shows transaction count when provided", () => {
    render(
      <SummaryCard
        title="Test"
        totalIncome={1000}
        totalExpense={500}
        balance={500}
        transactionCount={150}
      />
    );
    expect(screen.getByText("150")).toBeInTheDocument();
  });
});
