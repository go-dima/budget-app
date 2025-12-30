# Budget Viewer

A budget viewer application for viewing and analyzing bank transaction data from Excel files or existing SQLite databases.

## Features

- Import bank transactions from Excel files (Hebrew format)
- Import existing SQLite database files directly
- View overall and per-account financial summaries
- Generate reports grouped by month, category, or year
- Filter transactions by account, category, and date range
- Manage default excluded categories
- All data stays on your local machine

## Architecture

The application uses a client-server architecture:

- **Backend**: Node.js/Express with better-sqlite3 for native SQLite operations
- **Frontend**: React SPA that communicates with the backend via REST API
- **Storage**: SQLite database files stored in the `data/` folder

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: better-sqlite3 (native SQLite bindings)
- **Excel Parsing**: SheetJS (xlsx)
- **Language**: TypeScript

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design 6
- **Testing**: Vitest
- **Component Docs**: Storybook

## Project Structure

```
budget-app/
├── backend/               # TypeScript/Express backend
│   ├── src/
│   │   ├── db/            # Database layer
│   │   │   ├── SqliteManager.ts
│   │   │   └── repositories/
│   │   ├── services/      # Business logic
│   │   │   ├── AccountService.ts
│   │   │   ├── ReportService.ts
│   │   │   ├── AdminService.ts
│   │   │   └── ImportService.ts
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utilities (Excel parser)
│   │   └── types/         # TypeScript types
│   └── Dockerfile
├── frontend/              # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
│   └── Dockerfile
├── backend-python/        # Legacy Python backend (reference)
├── data/                  # SQLite database files
└── docker-compose.yml
```

## Quick Start

### Using Docker (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Access the app at http://localhost:3000
# API available at http://localhost:8000
```

### Manual Development Setup

**Backend:**
```bash
cd backend
npm install
npm run dev     # Development with hot reload
npm run build   # Build for production
npm start       # Run production build
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev     # Development server at http://localhost:5173
npm run build   # Build for production
npm run test    # Run tests
npm run storybook  # Component documentation
```

## Usage

1. **Start the Application**: Run `docker-compose up` or start both backend and frontend manually
2. **Import Data**: Go to the Admin page to import data:
   - **Excel files**: Upload `.xlsx` or `.xls` files - each sheet becomes a separate account
   - **Database files**: Upload existing `.db` files directly
3. **View Reports**: Use the Overview and Report pages to analyze your data
4. **Filter Data**: Use the sidebar filters to narrow down transactions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| GET | `/api/accounts/:id` | Get account details |
| GET | `/api/transactions` | List transactions (with filters) |
| GET | `/api/reports/overview` | Get financial overview |
| GET | `/api/reports/aggregated` | Get aggregated report |
| GET | `/api/admin/databases` | List loaded databases |
| DELETE | `/api/admin/databases/:id` | Delete a database |
| GET | `/api/admin/categories` | Get all categories |
| GET | `/api/admin/excluded-categories` | Get excluded categories |
| PUT | `/api/admin/excluded-categories` | Set excluded categories |
| POST | `/api/import/preview` | Preview Excel file |
| POST | `/api/import/execute` | Execute Excel import |
| POST | `/api/import/database` | Import SQLite database |

## Data Storage

### Database Files

The application stores data in SQLite database files in the `data/` folder:

- `accounts.db` - Account metadata and settings
- `settings.db` - Application settings (excluded categories)
- `{account_name}.db` - Transaction data per account

### Docker Volume

When running with Docker, the `./data` folder is mounted into the container, ensuring data persists between restarts.

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

## Environment Variables

### Backend
- `PORT` - Server port (default: 8000)
- `BUDGET_DB_PATH` - Path to data folder (default: `../data`)
- `BUDGET_CORS_ORIGINS` - Allowed CORS origins (comma-separated or JSON array)

### Frontend
- `VITE_API_URL` - Backend API URL (default: `http://localhost:8000`)

## Development

### Code Quality

The project uses pre-commit hooks:

```bash
# Install pre-commit hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

### Testing

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
