import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def temp_db_dir():
    with tempfile.TemporaryDirectory() as tmpdir:
        original_path = settings.db_path
        settings.db_path = Path(tmpdir)
        yield Path(tmpdir)
        settings.db_path = original_path
