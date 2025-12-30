from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Budget Viewer API"
    db_path: Path = Path(__file__).parent.parent / "data"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_prefix = "BUDGET_"


settings = Settings()
