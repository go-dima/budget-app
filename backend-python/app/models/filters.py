from pydantic import BaseModel


class GlobalFilters(BaseModel):
    account_ids: list[str] = []
    category_names: list[str] = []
    date_from: int | None = None
    date_to: int | None = None

    def is_empty(self) -> bool:
        return (
            not self.account_ids
            and not self.category_names
            and self.date_from is None
            and self.date_to is None
        )


class ExcludedCategories(BaseModel):
    category_names: list[str] = []
