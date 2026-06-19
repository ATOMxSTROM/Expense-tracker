import { prisma } from "@/lib/prisma";
import { createProject, deleteProject } from "./actions";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, _count: { select: { transactions: true } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Projects</h1>
        <p className="text-sm text-slate-900">Work tracked per client, or internal.</p>
      </div>

      <form
        action={createProject}
        className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          name="name"
          placeholder="Project name *"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="clientId" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">No client (internal)</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <select name="status" className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <input
          name="budget"
          placeholder="Budget (optional)"
          type="number"
          step="0.01"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="col-span-full w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Add project
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-900">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Budget</th>
              <th className="px-4 py-2 font-medium">Transactions</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{project.name}</td>
                <td className="px-4 py-2 text-slate-900">{project.client?.name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{project.status}</td>
                <td className="px-4 py-2 text-slate-900">
                  {project.budget ? `₹${project.budget.toString()}` : "—"}
                </td>
                <td className="px-4 py-2 text-slate-900">{project._count.transactions}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={project.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-900">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
