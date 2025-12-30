import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models import (
    FilePreviewResponse,
    ImportExecuteResponse,
    ImportRequest,
    ImportResult,
)
from app.services import import_service

router = APIRouter()


@router.post("/preview", response_model=FilePreviewResponse)
async def preview_excel(file: UploadFile = File(...)):
    """
    Preview an Excel file and return sheet information for the import wizard.
    The file is stored temporarily for later execution.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")

    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        result = import_service.preview_excel(tmp_path)
        return result
    finally:
        # Clean up the original temp file (import_service stores its own copy)
        tmp_path.unlink(missing_ok=True)


@router.post("/execute", response_model=ImportExecuteResponse)
async def execute_import(request: ImportRequest):
    """
    Execute the import with user's selections from the wizard.
    """
    result = import_service.execute_import(request)
    return result


@router.post("/excel", response_model=ImportResult)
async def import_excel(file: UploadFile = File(...)):
    """
    Import an Excel file with bank transactions (legacy single-step import).
    Each sheet in the file represents a different account.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")

    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        result = import_service.import_excel(tmp_path)
        return result
    finally:
        # Clean up temp file
        tmp_path.unlink(missing_ok=True)
