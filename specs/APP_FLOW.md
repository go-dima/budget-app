# App Flow — Visual Diagrams

## Page Navigation Flow

How the user navigates between pages and what triggers each transition.

```mermaid
flowchart TD
    Entry([App Load]) --> Accounts

    NavBar -->|"/"| Accounts
    NavBar -->|"/transactions"| Transactions
    NavBar -->|"/reports"| Reports
    NavBar -->|Settings button"| Settings

    Accounts -->|"Click category row"| Transactions_Cat["Transactions\n(?categoryIds=...)"]
    Reports -->|"Click category row"| Transactions_Cat

    Transactions_Cat -->|"Dismiss chip"| Transactions

    Settings -->|redirect| SettingsCat["Settings / Categories"]

    SettingsMenu -->|"Hidden Categories"| SettingsCat
    SettingsMenu -->|"Category Mapping"| SettingsMapping["Settings / Category Mapping"]
    SettingsMenu -->|"Payment Mapping"| SettingsPayment["Settings / Payment Mapping"]
    SettingsMenu -->|"Column Mapping"| SettingsColumn["Settings / Column Mapping"]
    SettingsMenu -->|"Databases"| SettingsDB["Settings / Databases"]
    SettingsMenu -->|"Import"| SettingsImport["Settings / Import"]

    Settings --- SettingsMenu["Left Menu"]

    subgraph Accounts["Accounts (/)"]
        AccCards[Account cards + monthly trend + top categories]
    end

    subgraph Transactions["/transactions"]
        TxTable[Transaction table + filters + quick stats]
    end

    subgraph Reports["/reports"]
        RepTable[Report tables by month / year / category]
    end

    subgraph Settings["/settings/*"]
        SettingsMenu
    end
```

---

## Import Data Lifecycle

How data flows from an Excel file into the database and read pages.

```mermaid
flowchart TD
    Excel([Excel file from bank]) --> Upload

    subgraph ImportPage["Import Page (/settings/import)"]
        Upload[Upload & Preview\ndetect sheets, header row,\nunknown columns, duplicates]
        Upload -->|"unknown columns?"| ColMap[Column Mapping Step\nmap source columns → fields]
        Upload -->|"known columns"| Execute
        ColMap --> Execute
        Execute[Execute Import\nstage transactions,\nresolve categories & payment methods,\ntwo-tier duplicate detection]
        Execute --> Review[Category Review\nper-row overrides for category\nand payment method,\nskip probable duplicates]
        Review -->|Confirm| Commit[Commit to DB\napply overrides, insert transactions]
    end

    Commit --> DB[(budget.db)]

    DB --> Accounts[Accounts Page]
    DB --> Transactions[Transactions Page]
    DB --> Reports[Reports Page]

    subgraph MappingTables["Mapping Tables (Settings)"]
        CatMap[description_category_map]
        PMMap[description_payment_method_map]
        ColMapStore[settings — column_mapping JSON]
    end

    Execute -->|"reads"| MappingTables
    Review -->|"saves overrides"| MappingTables
```
