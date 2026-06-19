import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">UniqCon Tracker</h1>
        <p className="mt-1 text-sm text-slate-900">Sign in to your account</p>

        {message && (
          <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form action={login} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-900">
          No account?{" "}
          <Link href="/signup" className="font-medium text-slate-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
