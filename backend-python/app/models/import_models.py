from typing import Literal

from pydantic import BaseModel


class SheetInfo(BaseModel):
    """Information about a sheet in the uploaded Excel file."""

    name: str
    row_count: int
    headers: list[str]
    detected_mapping: dict[str, str]  # hebrew -> field
    sample_rows: list[dict]  # First 3 rows preview


class ExistingDbInfo(BaseModel):
    """Information about an existing database for an account."""

    account_id: str | None
    account_name: str
    existing_row_count: int
    last_transaction_date: int | None


class SheetPreview(BaseModel):
    """Preview of a sheet with comparison to existing database."""

    sheet: SheetInfo
    existing_db: ExistingDbInfo | None


class FilePreviewResponse(BaseModel):
    """Response from the preview endpoint."""

    file_id: str  # Temp file identifier
    sheets: list[SheetPreview]


class SheetImportConfig(BaseModel):
    """User configuration for importing a single sheet."""

    sheet_name: str
    selected: bool
    header_mapping: dict[str, str]
    import_mode: Literal["override", "append"]
    target_db_name: str  # Database file name (defaults to sheet name)
    target_account_name: str  # Display name for the account (defaults to sheet name)


class ImportRequest(BaseModel):
    """Request to execute import with user's selections."""

    file_id: str
    sheets: list[SheetImportConfig]


class SheetImportResult(BaseModel):
    """Result of importing a single sheet."""

    sheet_name: str
    account_name: str
    success: bool
    rows_imported: int
    rows_skipped: int
    error: str | None = None


class ImportExecuteResponse(BaseModel):
    """Response from the execute endpoint."""

    success: bool
    results: list[SheetImportResult]
    total_rows_imported: int
    total_rows_skipped: int
