# Budget Viewer

A budget viewer application for viewing and analyzing bank transaction data from Excel files.

## Features

- Import bank transactions from Excel files (Hebrew format)
- View overall and per-account financial summaries
- Generate reports grouped by month, category, or year
- Filter transactions by account, category, and date range
- Manage default excluded categories

## Tech Stack

- **Backend**: Python, FastAPI, Pydantic, SQLite
- **Frontend**: TypeScript, React, Vite, Ant Design
- **Testing**: pytest (backend), Vitest (frontend)
- **Deployment**: Docker, Docker Compose

## Project Structure

```
budget-app/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── models/    # Pydantic models
│   │   ├── services/  # Business logic
│   │   ├── routers/   # API endpoints
│   │   └── utils/     # Utilities (Excel parser)
│   ├── data/          # SQLite databases
│   └── tests/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/
│   │   ├── contexts/  # React contexts
│   │   ├── hooks/     # Custom hooks
│   │   ├── pages/
│   │   └── types/     # TypeScript types
│   └── tests/
├── prd/               # Product requirements
└── docker-compose.yml
```

## Quick Start

### Using Docker (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Development Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest tests/ -v
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run Storybook
npm run storybook
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/accounts` | List all accounts |
| GET | `/api/transactions` | List transactions (with filters) |
| GET | `/api/reports/overview` | Get overview summary |
| GET | `/api/reports/aggregated` | Get grouped report |
| POST | `/api/import/excel` | Import Excel file |
| GET | `/api/admin/databases` | Get loaded databases info |
| GET/PUT | `/api/admin/excluded-categories` | Manage excluded categories |

### Query Parameters for Filtering

- `account_ids`: Comma-separated account IDs
- `categories`: Comma-separated category names
- `date_from`: Start date (Unix timestamp)
- `date_to`: End date (Unix timestamp)
- `group_by`: Grouping option (month, category, year)

## Excel File Format

The application expects Excel files with Hebrew column headers:

| Column | Hebrew | Description |
|--------|--------|-------------|
| Date | תאריך | Transaction date |
| Description | תיאור | Transaction description |
| Payment Method | אמצעי תשלום | Payment method |
| Category | קטגוריה | Transaction category |
| Details | פירוט | Additional details |
| Reference | אסמכתא | Reference number |
| Expense | חובה | Expense amount |
| Income | זכות | Income amount |
| Balance | יתרה | Running balance |

Each sheet in the Excel file represents a different account.

## Sample Data

A sample Excel file is available at: `prd/Flow Test.xlsx`

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `BUDGET_DB_PATH` | `./data` | Path to SQLite databases |
| `BUDGET_CORS_ORIGINS` | `["http://localhost:3000","http://localhost:5173"]` | CORS allowed origins |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API URL |

## Development

### Rebuilding After Code Changes

After modifying backend or frontend code, rebuild the application:

```bash
# Rebuild with Docker
docker-compose up --build

# Or rebuild manually:

# Backend (no build step needed, just restart)
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm run build

# For development with hot reload
cd frontend && npm run dev
```

### Backend Testing

```bash
cd backend
pytest tests/ -v
```

### Frontend Testing

```bash
cd frontend
npm run test
```

### Storybook

```bash
cd frontend
npm run storybook
```

## License

Private project.
