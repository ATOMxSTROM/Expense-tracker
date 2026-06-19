import { prisma } from "@/lib/prisma";
import { createClientRecord, deleteClient } from "./actions";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactions: true, projects: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Clients</h1>
        <p className="text-sm text-slate-900">Companies/people you bill or work with.</p>
      </div>

      <form
        action={createClientRecord}
        className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          name="name"
          placeholder="Client name *"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="contactEmail"
          placeholder="Contact email"
          type="email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="contactPhone"
          placeholder="Contact phone"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="notes"
          placeholder="Notes"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="col-span-full w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Add client
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-900">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Projects</th>
              <th className="px-4 py-2 font-medium">Transactions</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{client.name}</td>
                <td className="px-4 py-2 text-slate-900">{client.contactEmail ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{client.contactPhone ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{client._count.projects}</td>
                <td className="px-4 py-2 text-slate-900">{client._count.transactions}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteClient}>
                    <input type="hidden" name="id" value={client.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-900">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
