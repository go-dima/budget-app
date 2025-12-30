from pydantic import BaseModel

from app.models.account import AccountSummary


class OverviewSummary(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    last_transaction_date: int | None = None
    transaction_count: int


class OverviewResponse(BaseModel):
    overall: OverviewSummary
    accounts: list[AccountSummary]


class AggregatedReportItem(BaseModel):
    period: str
    income: float
    expense: float
    net_balance: float
    transaction_count: int


class ImportResult(BaseModel):
    accounts_created: int
    transactions_imported: int
    last_transaction_date: int | None = None
    errors: list[str] = []
