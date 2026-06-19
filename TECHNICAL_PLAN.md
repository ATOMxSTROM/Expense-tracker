# UniqCon Expense Tracker — Technical Plan

## 1. Goal

Track money flowing in and out of UniqCon (ad agency):
- **Income**: client payments, retainers, project fees.
- **Expenses**: scripting, video editing, software subscriptions, freelancer payments, ad spend, etc.

Used by the owner + a few team members. Needs to answer: *how much did we make, how much did we spend, on what, and for which client, and are we profitable?*

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React + TypeScript) | Full-stack framework, one codebase for UI + API |
| Styling | Tailwind CSS | Fast to build clean dashboards/forms |
| Backend | Next.js API routes | No separate server needed at this scale |
| Database | PostgreSQL via Supabase | Cloud Postgres + Auth + Storage bundled, generous free tier |
| ORM | Prisma | Type-safe DB access, easy migrations |
| Auth | Supabase Auth | Email/password login, works well with Postgres Row Level Security |
| Charts | Recharts | Dashboard visualizations |
| Deployment | Vercel (app) + Supabase (DB/auth) | Both free tier, simple CI deploy |

## 3. Roles & Access

| Role | Can do |
|---|---|
| **Owner** | Everything: see all financials, manage team, manage clients/projects, create/edit/delete any transaction or invoice |
| **Admin** | Same as Owner except managing team members/billing |
| **Member** | Add/edit their own expenses (e.g. log a video editing cost), view their own entries only — no full dashboard access |

Enforced via Postgres Row Level Security (RLS) policies tied to Supabase Auth user id + role, not just app-level checks.

## 4. Data Model

### User
- `id`, `email`, `name`, `role` (`owner` | `admin` | `member`), `created_at`

### Client
- `id`, `name`, `contact_email`, `contact_phone`, `notes`, `created_at`

### Project
- `id`, `client_id` (nullable — internal projects allowed), `name`, `status` (`active` | `completed` | `archived`), `budget` (nullable), `created_at`

### Category
- `id`, `name`, `type` (`income` | `expense`)
- Seed defaults:
  - Expense: Scripting, Video Editing, Software/Subscriptions, Freelancer Payment, Ad Spend, Office/Misc
  - Income: Client Payment, Retainer, Other Income

### Transaction
Single table for both income and expense (simplifies reporting — one query, filter by `type`).
- `id`
- `type` (`income` | `expense`)
- `amount` (decimal, always positive — sign comes from `type`)
- `currency` (default INR, configurable)
- `date`
- `category_id`
- `client_id` (nullable)
- `project_id` (nullable)
- `description`
- `payment_method` (`bank` | `cash` | `upi` | `card` | `other`)
- `attachment_url` (receipt/invoice file, stored in Supabase Storage — see Phase 1 below)
- `created_by` (user id)
- `created_at`

### Invoice
- `id`, `client_id`, `project_id` (nullable), `invoice_number`, `issue_date`, `due_date`
- `status` (`draft` | `sent` | `paid` | `overdue`)
- `total_amount`
- `notes`
- `created_at`

### InvoiceLineItem
- `id`, `invoice_id`, `description`, `quantity`, `rate`, `amount`

**Relationships:** Client 1—N Project, Client 1—N Transaction, Client 1—N Invoice, Project 1—N Transaction, Invoice 1—N InvoiceLineItem, Category 1—N Transaction.

## 5. Core Business Logic

- **Balance / Profit** = `SUM(amount WHERE type = income) - SUM(amount WHERE type = expense)`, computable for any date range, client, or project.
- **Monthly P&L**: group transactions by month → income total, expense total, net.
- **Category breakdown**: group expenses by `category_id` within a date range → pie/bar chart.
- **Client profitability**: for a given client, `income from that client's transactions/invoices` − `expenses tagged to that client's projects`.
- **Invoice → Income link**: marking an invoice `paid` auto-creates (or links to) a matching `income` Transaction so paid invoices show up in revenue without double entry.
- **Overdue detection**: invoice is `overdue` if `due_date < today` and `status != paid`. Computed on read, not stored as a cron-updated flag initially.
- **Member visibility rule**: when a `member` queries transactions, results are filtered to `created_by = self` at the RLS level, not just hidden in the UI.

## 6. MVP Phases

**Phase 1 — Core tracking**
- Auth (login/signup, roles)
- Add/edit/delete Transaction (income + expense), Category, Client, Project
- Attach an invoice file (PDF/image) to a transaction when logging it, linked to a client — just file storage via `attachment_url` + Supabase Storage, no invoice generation/status/line items yet
- List + filter transactions (by date, type, category, client) — including a per-client view of all attached invoice files
- Dashboard: total income, total expense, net profit (this month / custom range)

**Phase 2 — Reporting**
- Category breakdown chart
- Client profitability view
- Monthly trend chart

**Phase 3 — Invoicing**
- Create/send invoices, line items
- Invoice status tracking, link paid invoices to income transactions

## 7. Project Structure (planned)

```
/app                # Next.js app router pages
  /dashboard
  /transactions
  /clients
  /projects
  /invoices
  /api              # API route handlers
/components         # Shared UI components
/lib                # Prisma client, Supabase client, helpers
/prisma
  schema.prisma     # DB schema (source of truth for tables above)
```

## 8. Open Questions / Decisions for Later

- Multi-currency: assume INR only for now, revisit if needed.
- Recurring expenses (e.g. monthly software subscriptions) — auto-generate transactions? (Phase 2+)
- Tax/GST handling on invoices — not in MVP, flag if needed later.
