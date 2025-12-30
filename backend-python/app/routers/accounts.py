from fastapi import APIRouter, HTTPException

from app.models import Account
from app.services import db_service

router = APIRouter()


@router.get("", response_model=list[Account])
async def list_accounts():
    """List all accounts."""
    return db_service.get_all_accounts()


@router.get("/{account_id}", response_model=Account)
async def get_account(account_id: str):
    """Get account by ID."""
    account = db_service.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account
