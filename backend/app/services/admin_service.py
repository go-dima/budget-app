from app.models import DbInfo
from app.services.db_service import db_service


class AdminService:
    """Service for admin operations."""

    def get_excluded_categories(self) -> list[str]:
        """Get default excluded categories."""
        return db_service.get_excluded_categories()

    def set_excluded_categories(self, categories: list[str]) -> list[str]:
        """Set default excluded categories."""
        db_service.set_excluded_categories(categories)
        return categories

    def get_database_info(self) -> list[DbInfo]:
        """Get information about all loaded databases."""
        return db_service.get_database_info()

    def get_all_categories(self) -> list[str]:
        """Get all unique categories."""
        return db_service.get_all_categories()

    def delete_database(self, account_id: str) -> bool:
        """Delete a database/account."""
        return db_service.delete_account(account_id)


admin_service = AdminService()
