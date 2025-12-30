import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

from app.config import settings
from app.models import (
    Account,
    AccountSummary,
    DbInfo,
    GlobalFilters,
    Transaction,
    TransactionCreate,
)


class DatabaseService:
    """Service for managing SQLite databases (one per account)."""

    ACCOUNTS_DB = "accounts.db"
    SETTINGS_DB = "settings.db"

    def __init__(self):
        self._ensure_data_dir()
        self._init_accounts_db()
        self._init_settings_db()

    def _ensure_data_dir(self):
        settings.db_path.mkdir(parents=True, exist_ok=True)

    def _get_accounts_db_path(self) -> Path:
        return settings.db_path / self.ACCOUNTS_DB

    def _get_settings_db_path(self) -> Path:
        return settings.db_path / self.SETTINGS_DB

    def _get_account_db_path(self, account_name: str) -> Path:
        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in account_name)
        return settings.db_path / f"{safe_name}.db"

    def _init_accounts_db(self):
        """Initialize the accounts metadata database."""
        with sqlite3.connect(self._get_accounts_db_path()) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id TEXT PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    db_path TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            conn.commit()

    def _init_settings_db(self):
        """Initialize the settings database."""
        with sqlite3.connect(self._get_settings_db_path()) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            """)
            conn.commit()

    def _init_account_db(self, db_path: Path):
        """Initialize a new account database with transactions table."""
        with sqlite3.connect(db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    date INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    payment_method TEXT,
                    category TEXT NOT NULL,
                    details TEXT,
                    reference TEXT,
                    expense REAL DEFAULT 0,
                    income REAL DEFAULT 0,
                    balance REAL DEFAULT 0,
                    raw_date_string TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_date ON transactions(date)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_category ON transactions(category)")
            conn.commit()

    def create_account(self, name: str, db_name: str | None = None) -> Account:
        """Create a new account and its database.

        Args:
            name: Display name for the account
            db_name: Database file name (defaults to name if not provided)
        """
        account_id = str(uuid.uuid4())
        db_path = self._get_account_db_path(db_name or name)
        created_at = datetime.now()

        self._init_account_db(db_path)

        with sqlite3.connect(self._get_accounts_db_path()) as conn:
            conn.execute(
                "INSERT INTO accounts (id, name, db_path, created_at) VALUES (?, ?, ?, ?)",
                (account_id, name, str(db_path), created_at.isoformat()),
            )
            conn.commit()

        return Account(
            id=account_id,
            name=name,
            db_path=str(db_path),
            transaction_count=0,
            last_transaction_date=None,
            created_at=created_at,
        )

    def get_account(self, account_id: str) -> Account | None:
        """Get account by ID."""
        with sqlite3.connect(self._get_accounts_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM accounts WHERE id = ?", (account_id,)).fetchone()
            if not row:
                return None

            stats = self._get_account_stats(Path(row["db_path"]))
            return Account(
                id=row["id"],
                name=row["name"],
                db_path=row["db_path"],
                transaction_count=stats["count"],
                last_transaction_date=stats["last_date"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )

    def get_account_by_name(self, name: str) -> Account | None:
        """Get account by display name."""
        with sqlite3.connect(self._get_accounts_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM accounts WHERE name = ?", (name,)).fetchone()
            if not row:
                return None

            stats = self._get_account_stats(Path(row["db_path"]))
            return Account(
                id=row["id"],
                name=row["name"],
                db_path=row["db_path"],
                transaction_count=stats["count"],
                last_transaction_date=stats["last_date"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )

    def get_account_by_db_path(self, db_name: str) -> Account | None:
        """Get account by database file name."""
        db_path = str(self._get_account_db_path(db_name))
        with sqlite3.connect(self._get_accounts_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM accounts WHERE db_path = ?", (db_path,)).fetchone()
            if not row:
                return None

            stats = self._get_account_stats(Path(row["db_path"]))
            return Account(
                id=row["id"],
                name=row["name"],
                db_path=row["db_path"],
                transaction_count=stats["count"],
                last_transaction_date=stats["last_date"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )

    def get_all_accounts(self) -> list[Account]:
        """Get all accounts."""
        with sqlite3.connect(self._get_accounts_db_path()) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM accounts ORDER BY name").fetchall()

        accounts = []
        for row in rows:
            stats = self._get_account_stats(Path(row["db_path"]))
            accounts.append(
                Account(
                    id=row["id"],
                    name=row["name"],
                    db_path=row["db_path"],
                    transaction_count=stats["count"],
                    last_transaction_date=stats["last_date"],
                    created_at=datetime.fromisoformat(row["created_at"]),
                )
            )
        return accounts

    def _get_account_stats(self, db_path: Path) -> dict:
        """Get transaction count and last date for an account."""
        if not db_path.exists():
            return {"count": 0, "last_date": None}

        with sqlite3.connect(db_path) as conn:
            count = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
            last_date = conn.execute("SELECT MAX(date) FROM transactions").fetchone()[0]
            return {"count": count, "last_date": last_date}

    def insert_transactions(self, account_id: str, transactions: list[TransactionCreate]) -> int:
        """Insert transactions into an account's database."""
        account = self.get_account(account_id)
        if not account:
            raise ValueError(f"Account not found: {account_id}")

        with sqlite3.connect(account.db_path) as conn:
            for txn in transactions:
                txn_id = str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO transactions
                    (id, date, description, payment_method, category, details,
                     reference, expense, income, balance, raw_date_string, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        txn_id,
                        txn.date,
                        txn.description,
                        txn.payment_method,
                        txn.category,
                        txn.details,
                        txn.reference,
                        txn.expense,
                        txn.income,
                        txn.balance,
                        txn.raw_date_string,
                        datetime.now().isoformat(),
                    ),
                )
            conn.commit()

        return len(transactions)

    def get_transactions(self, filters: GlobalFilters | None = None) -> list[Transaction]:
        """Get all transactions across all accounts with optional filters."""
        accounts = self.get_all_accounts()
        all_transactions = []

        for account in accounts:
            if filters and filters.account_ids and account.id not in filters.account_ids:
                continue

            txns = self._get_account_transactions(account, filters)
            all_transactions.extend(txns)

        all_transactions.sort(key=lambda t: t.date, reverse=True)
        return all_transactions

    def _get_account_transactions(
        self, account: Account, filters: GlobalFilters | None = None
    ) -> list[Transaction]:
        """Get transactions from a specific account with filters."""
        if not Path(account.db_path).exists():
            return []

        query = "SELECT * FROM transactions WHERE 1=1"
        params: list = []

        if filters:
            if filters.category_names:
                placeholders = ",".join("?" * len(filters.category_names))
                query += f" AND category IN ({placeholders})"
                params.extend(filters.category_names)

            if filters.date_from is not None:
                query += " AND date >= ?"
                params.append(filters.date_from)

            if filters.date_to is not None:
                query += " AND date <= ?"
                params.append(filters.date_to)

        query += " ORDER BY date DESC"

        with sqlite3.connect(account.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query, params).fetchall()

        return [
            Transaction(
                id=row["id"],
                account_id=account.id,
                date=row["date"],
                description=row["description"],
                payment_method=row["payment_method"],
                category=row["category"],
                details=row["details"],
                reference=row["reference"],
                expense=row["expense"],
                income=row["income"],
                balance=row["balance"],
                raw_date_string=row["raw_date_string"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]

    def get_all_categories(self) -> list[str]:
        """Get all unique categories across all accounts."""
        accounts = self.get_all_accounts()
        categories = set()

        for account in accounts:
            if not Path(account.db_path).exists():
                continue

            with sqlite3.connect(account.db_path) as conn:
                rows = conn.execute("SELECT DISTINCT category FROM transactions").fetchall()
                categories.update(row[0] for row in rows)

        return sorted(categories)

    def get_account_summary(
        self, account: Account, filters: GlobalFilters | None = None
    ) -> AccountSummary:
        """Calculate summary for a specific account."""
        txns = self._get_account_transactions(account, filters)

        total_income = sum(t.income for t in txns)
        total_expense = sum(t.expense for t in txns)
        last_date = max((t.date for t in txns), default=None)

        return AccountSummary(
            account_id=account.id,
            account_name=account.name,
            total_income=total_income,
            total_expense=total_expense,
            balance=total_income - total_expense,
            last_transaction_date=last_date,
            transaction_count=len(txns),
        )

    def get_excluded_categories(self) -> list[str]:
        """Get excluded categories from settings."""
        with sqlite3.connect(self._get_settings_db_path()) as conn:
            row = conn.execute(
                "SELECT value FROM settings WHERE key = 'excluded_categories'"
            ).fetchone()
            if row:
                return json.loads(row[0])
            return []

    def set_excluded_categories(self, categories: list[str]):
        """Set excluded categories in settings."""
        with sqlite3.connect(self._get_settings_db_path()) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO settings (key, value)
                VALUES ('excluded_categories', ?)
                """,
                (json.dumps(categories),),
            )
            conn.commit()

    def get_database_info(self) -> list[DbInfo]:
        """Get information about all loaded databases."""
        accounts = self.get_all_accounts()
        return [
            DbInfo(
                account_id=acc.id,
                account_name=acc.name,
                db_path=acc.db_path,
                transaction_count=acc.transaction_count,
                last_transaction_date=acc.last_transaction_date,
            )
            for acc in accounts
        ]

    def clear_account_transactions(self, account_id: str):
        """Clear all transactions from an account."""
        account = self.get_account(account_id)
        if not account:
            raise ValueError(f"Account not found: {account_id}")

        with sqlite3.connect(account.db_path) as conn:
            conn.execute("DELETE FROM transactions")
            conn.commit()

    def delete_account(self, account_id: str) -> bool:
        """Delete an account and its database file."""
        account = self.get_account(account_id)
        if not account:
            raise ValueError(f"Account not found: {account_id}")

        # Delete the database file
        db_path = Path(account.db_path)
        if db_path.exists():
            db_path.unlink()

        # Remove from accounts table
        with sqlite3.connect(self._get_accounts_db_path()) as conn:
            conn.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
            conn.commit()

        return True


db_service = DatabaseService()
