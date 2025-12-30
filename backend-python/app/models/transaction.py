from datetime import datetime

from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    date: int = Field(..., description="Unix timestamp")
    description: str
    payment_method: str | None = None
    category: str
    details: str | None = None
    reference: str | None = None
    expense: float = 0.0
    income: float = 0.0
    balance: float = 0.0
    raw_date_string: str


class TransactionCreate(TransactionBase):
    account_id: str


class Transaction(TransactionBase):
    id: str
    account_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionInDB(Transaction):
    """Transaction as stored in database."""

    pass
