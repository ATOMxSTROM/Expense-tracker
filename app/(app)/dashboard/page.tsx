import { prisma } from "@/lib/prisma";
import { requireProfile, isFullAccess } from "@/lib/auth";
import type { Prisma } from "@/app/generated/prisma/client";

function formatCurrency(value: Prisma.Decimal | number) {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const fullAccess = isFullAccess(profile);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const baseWhere: Prisma.TransactionWhereInput = fullAccess ? {} : { createdBy: profile.id };
  const monthWhere: Prisma.TransactionWhereInput = {
    ...baseWhere,
    date: { gte: monthStart, lte: monthEnd },
  };

  const [monthIncome, monthExpense, recent] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...monthWhere, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...monthWhere, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: baseWhere,
      orderBy: { date: "desc" },
      take: 8,
      include: { category: true, client: true },
    }),
  ]);

  const income = monthIncome._sum.amount ?? 0;
  const expense = monthExpense._sum.amount ?? 0;
  const net = Number(income) - Number(expense);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-900">
          {now.toLocaleString("en-IN", { month: "long", year: "numeric" })} —{" "}
          {fullAccess ? "company-wide" : "your entries"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-900">Income</p>
          <p className="mt-1 text-2xl font-semibold text-green-700">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-900">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{formatCurrency(expense)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-900">Net</p>
          <p className={`mt-1 text-2xl font-semibold ${net >= 0 ? "text-slate-900" : "text-red-700"}`}>
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-900">Recent transactions</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-900">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Client</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
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
                  <td className="px-4 py-2 font-medium text-slate-900">{formatCurrency(t.amount)}</td>
                  <td className="px-4 py-2 text-slate-900">{t.category.name}</td>
                  <td className="px-4 py-2 text-slate-900">{t.client?.name ?? "—"}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-900">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
