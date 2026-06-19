import { prisma } from "@/lib/prisma";
import { requireProfile, isFullAccess } from "@/lib/auth";
import { getSignedAttachmentUrl } from "@/lib/storage";
import { createTransaction, deleteTransaction } from "./actions";
import type { Prisma, TransactionType } from "@/app/generated/prisma/client";

type SearchParams = {
  type?: string;
  categoryId?: string;
  clientId?: string;
  from?: string;
  to?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await requireProfile();
  const filters = await searchParams;

  const where: Prisma.TransactionWhereInput = {};
  if (!isFullAccess(profile)) where.createdBy = profile.id;
  if (filters.type) where.type = filters.type as TransactionType;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  const [transactions, categories, clients, projects] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { category: true, client: true, project: true, creator: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
  ]);

  const attachmentLinks = await Promise.all(
    transactions.map((t) => (t.attachmentUrl ? getSignedAttachmentUrl(t.attachmentUrl) : null))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Transactions</h1>
        <p className="text-sm text-slate-900">
          {isFullAccess(profile) ? "All income and expenses." : "Your logged income and expenses."}
        </p>
      </div>

      <details className="rounded-lg border border-slate-200 bg-white" open>
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-900">
          Add transaction
        </summary>
        <form
          action={createTransaction}
          className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <select name="type" required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount *"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select name="categoryId" required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Category *</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "INCOME" ? "income" : "expense"})
              </option>
            ))}
          </select>
          <select name="clientId" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="projectId" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="paymentMethod" className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue="OTHER">
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            name="description"
            placeholder="Description"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="col-span-full">
            <label className="block text-xs font-medium text-slate-900">
              Invoice / receipt (optional)
            </label>
            <input
              name="attachment"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="mt-1 text-sm"
            />
          </div>
          <button
            type="submit"
            className="col-span-full w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Save transaction
          </button>
        </form>
      </details>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-900">Type</label>
          <select name="type" defaultValue={filters.type ?? ""} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-900">Category</label>
          <select name="categoryId" defaultValue={filters.categoryId ?? ""} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-900">Client</label>
          <select name="clientId" defaultValue={filters.clientId ?? ""} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">All</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-900">From</label>
          <input name="from" type="date" defaultValue={filters.from ?? ""} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-900">To</label>
          <input name="to" type="date" defaultValue={filters.to ?? ""} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-900">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Logged by</th>
              <th className="px-4 py-2 font-medium">Invoice</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-900">{t.date.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.type === "INCOME" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {t.type === "INCOME" ? "Income" : "Expense"}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium text-slate-900">
                  ₹{t.amount.toString()}
                </td>
                <td className="px-4 py-2 text-slate-900">{t.category.name}</td>
                <td className="px-4 py-2 text-slate-900">{t.description ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{t.client?.name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{t.project?.name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{t.creator.name ?? t.creator.email}</td>
                <td className="px-4 py-2">
                  {attachmentLinks[i] ? (
                    <a href={attachmentLinks[i]!} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-900">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
