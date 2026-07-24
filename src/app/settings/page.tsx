import { isAzureAdConfigured, isOutlookConfigured, isSharePointConfigured, isTeamsConfigured } from "@/lib/graph/config";

const ITEMS = [
  {
    key: "azureAd",
    name: "Sign-in with Microsoft (Azure AD)",
    check: isAzureAdConfigured,
    envVars: ["AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET", "AZURE_AD_TENANT_ID"],
    help: "Register an app in Microsoft Entra ID and set these so users sign in with their company account.",
  },
  {
    key: "sharePoint",
    name: "SharePoint / OneDrive documents",
    check: isSharePointConfigured,
    envVars: ["SHAREPOINT_SITE_ID", "SHAREPOINT_DRIVE_ID"],
    help: "Requires Azure AD to be configured, plus the target SharePoint site/drive IDs, and the Sites.ReadWrite.All (or Files.ReadWrite.All) Graph permission.",
  },
  {
    key: "outlook",
    name: "Outlook email & calendar",
    check: isOutlookConfigured,
    envVars: ["AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET", "AZURE_AD_TENANT_ID"],
    help: "Uses the same Azure AD app registration, with Mail.Send and Calendars.ReadWrite Graph permissions granted.",
  },
  {
    key: "teams",
    name: "Teams notifications",
    check: isTeamsConfigured,
    envVars: ["TEAMS_WEBHOOK_URL"],
    help: "Create an Incoming Webhook connector on a Teams channel and set its URL here.",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Microsoft 365 connections</h1>
        <p className="text-sm text-zinc-500">
          Set the corresponding environment variables and restart the app to enable each
          integration. See SETUP.md in the repo for step-by-step instructions.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {ITEMS.map((item) => {
          const connected = item.check();
          return (
            <div key={item.key} className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-medium text-zinc-900">{item.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{item.help}</p>
                <p className="mt-2 font-mono text-xs text-zinc-400">{item.envVars.join(", ")}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  connected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {connected ? "Connected" : "Not connected"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
