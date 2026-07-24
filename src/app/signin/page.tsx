import { signIn } from "@/lib/auth";
import { isAzureAdConfigured } from "@/lib/graph/config";
import { prisma } from "@/lib/prisma";
import { localLoginEnabled } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/";
  const azureConfigured = isAzureAdConfigured();
  const users = localLoginEnabled
    ? await prisma.user.findMany({ orderBy: { name: "asc" } })
    : [];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Bid Tracker</h1>
        <p className="text-sm text-zinc-500">Sign in to continue.</p>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6">
        {azureConfigured && (
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Sign in with Microsoft
            </button>
          </form>
        )}

        {localLoginEnabled && (
          <>
            {azureConfigured && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="h-px flex-1 bg-zinc-200" />
                or, for local testing
                <div className="h-px flex-1 bg-zinc-200" />
              </div>
            )}
            <form
              action={async (formData: FormData) => {
                "use server";
                const userId = formData.get("userId");
                if (typeof userId === "string" && userId) {
                  await signIn("local-dev", { userId, redirectTo });
                }
              }}
              className="flex flex-col gap-2"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Sign in as (dev only)</span>
                <select
                  name="userId"
                  required
                  defaultValue=""
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select a user
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
              >
                Continue
              </button>
            </form>
          </>
        )}

        {!azureConfigured && !localLoginEnabled && (
          <p className="text-sm text-red-600">
            No sign-in method is configured. Set AZURE_AD_CLIENT_ID/SECRET/TENANT_ID, or set
            ALLOW_LOCAL_LOGIN=true for local testing.
          </p>
        )}
      </div>
    </div>
  );
}
