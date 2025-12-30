from fastapi import APIRouter, Query

from app.models import GlobalFilters, Transaction
from app.services import db_service

router = APIRouter()


@router.get("", response_model=list[Transaction])
async def list_transactions(
    account_ids: str | None = Query(None, description="Comma-separated account IDs"),
    categories: str | None = Query(None, description="Comma-separated category names"),
    date_from: int | None = Query(None, description="Start date (Unix timestamp)"),
    date_to: int | None = Query(None, description="End date (Unix timestamp)"),
):
    """List all transactions with optional filters."""
    filters = GlobalFilters(
        account_ids=account_ids.split(",") if account_ids else [],
        category_names=categories.split(",") if categories else [],
        date_from=date_from,
        date_to=date_to,
    )
    return db_service.get_transactions(filters if not filters.is_empty() else None)
