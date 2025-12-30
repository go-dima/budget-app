from collections import defaultdict
from datetime import datetime
from typing import Literal

from app.models import (
    AggregatedReportItem,
    GlobalFilters,
    OverviewResponse,
    OverviewSummary,
)
from app.services.db_service import db_service

GroupByOption = Literal["month", "category", "year"]


class ReportService:
    """Service for generating reports."""

    def get_overview(self, filters: GlobalFilters | None = None) -> OverviewResponse:
        """Get overview with overall summary and per-account summaries."""
        accounts = db_service.get_all_accounts()

        # Apply account filter
        if filters and filters.account_ids:
            accounts = [a for a in accounts if a.id in filters.account_ids]

        account_summaries = [
            db_service.get_account_summary(account, filters) for account in accounts
        ]

        # Calculate overall summary
        total_income = sum(s.total_income for s in account_summaries)
        total_expense = sum(s.total_expense for s in account_summaries)
        total_count = sum(s.transaction_count for s in account_summaries)
        last_dates = [
            s.last_transaction_date
            for s in account_summaries
            if s.last_transaction_date is not None
        ]
        last_date = max(last_dates) if last_dates else None

        overall = OverviewSummary(
            total_income=total_income,
            total_expense=total_expense,
            balance=total_income - total_expense,
            last_transaction_date=last_date,
            transaction_count=total_count,
        )

        return OverviewResponse(overall=overall, accounts=account_summaries)

    def get_aggregated_report(
        self,
        group_by: GroupByOption = "month",
        filters: GlobalFilters | None = None,
    ) -> list[AggregatedReportItem]:
        """Get aggregated report grouped by month, category, or year."""
        transactions = db_service.get_transactions(filters)

        # Group transactions
        groups: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0, "count": 0})

        for txn in transactions:
            if group_by == "month":
                dt = datetime.fromtimestamp(txn.date)
                period = dt.strftime("%Y-%m")
            elif group_by == "year":
                dt = datetime.fromtimestamp(txn.date)
                period = dt.strftime("%Y")
            else:  # category
                period = txn.category

            groups[period]["income"] += txn.income
            groups[period]["expense"] += txn.expense
            groups[period]["count"] += 1

        # Convert to result items
        items = [
            AggregatedReportItem(
                period=period,
                income=data["income"],
                expense=data["expense"],
                net_balance=data["income"] - data["expense"],
                transaction_count=data["count"],
            )
            for period, data in groups.items()
        ]

        # Sort by period (descending for month/year, alphabetical for category)
        if group_by in ("month", "year"):
            items.sort(key=lambda x: x.period, reverse=True)
        else:
            items.sort(key=lambda x: x.period)

        return items


report_service = ReportService()
