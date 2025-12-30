from typing import Literal

from fastapi import APIRouter, Query

from app.models import AggregatedReportItem, GlobalFilters, OverviewResponse
from app.services import report_service

router = APIRouter()


@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    account_ids: str | None = Query(None, description="Comma-separated account IDs"),
    categories: str | None = Query(None, description="Comma-separated category names"),
    date_from: int | None = Query(None, description="Start date (Unix timestamp)"),
    date_to: int | None = Query(None, description="End date (Unix timestamp)"),
):
    """Get overview summary with overall and per-account summaries."""
    filters = GlobalFilters(
        account_ids=account_ids.split(",") if account_ids else [],
        category_names=categories.split(",") if categories else [],
        date_from=date_from,
        date_to=date_to,
    )
    return report_service.get_overview(filters if not filters.is_empty() else None)


@router.get("/aggregated", response_model=list[AggregatedReportItem])
async def get_aggregated(
    group_by: Literal["month", "category", "year"] = Query(
        "month", description="Group by: month, category, or year"
    ),
    account_ids: str | None = Query(None, description="Comma-separated account IDs"),
    categories: str | None = Query(None, description="Comma-separated category names"),
    date_from: int | None = Query(None, description="Start date (Unix timestamp)"),
    date_to: int | None = Query(None, description="End date (Unix timestamp)"),
):
    """Get aggregated report grouped by month, category, or year."""
    filters = GlobalFilters(
        account_ids=account_ids.split(",") if account_ids else [],
        category_names=categories.split(",") if categories else [],
        date_from=date_from,
        date_to=date_to,
    )
    return report_service.get_aggregated_report(
        group_by=group_by,
        filters=filters if not filters.is_empty() else None,
    )
