from datetime import datetime

from pydantic import BaseModel


class AccountBase(BaseModel):
    name: str


class AccountCreate(AccountBase):
    db_path: str


class Account(AccountBase):
    id: str
    db_path: str
    transaction_count: int = 0
    last_transaction_date: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AccountSummary(BaseModel):
    account_id: str
    account_name: str
    total_income: float
    total_expense: float
    balance: float
    last_transaction_date: int | None = None
    transaction_count: int


class DbInfo(BaseModel):
    account_id: str
    account_name: str
    db_path: str
    transaction_count: int
    last_transaction_date: int | None = None
