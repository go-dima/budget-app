from fastapi import APIRouter, HTTPException

from app.models import DbInfo, ExcludedCategories
from app.services import admin_service

router = APIRouter()


@router.get("/databases", response_model=list[DbInfo])
async def get_databases():
    """Get loaded database info."""
    return admin_service.get_database_info()


@router.delete("/databases/{account_id}")
async def delete_database(account_id: str):
    """Delete a database/account."""
    try:
        admin_service.delete_database(account_id)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/categories", response_model=list[str])
async def get_all_categories():
    """Get all unique categories."""
    return admin_service.get_all_categories()


@router.get("/excluded-categories", response_model=list[str])
async def get_excluded_categories():
    """Get excluded categories for default filter."""
    return admin_service.get_excluded_categories()


@router.put("/excluded-categories", response_model=list[str])
async def update_excluded_categories(payload: ExcludedCategories):
    """Update excluded categories."""
    return admin_service.set_excluded_categories(payload.category_names)
