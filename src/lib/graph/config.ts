export function isTeamsConfigured() {
  return Boolean(process.env.TEAMS_WEBHOOK_URL);
}

export function isAzureAdConfigured() {
  return Boolean(
    process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET &&
      process.env.AZURE_AD_TENANT_ID
  );
}

export function isSharePointConfigured() {
  return Boolean(isAzureAdConfigured() && process.env.SHAREPOINT_SITE_ID && process.env.SHAREPOINT_DRIVE_ID);
}

export function isOutlookConfigured() {
  return isAzureAdConfigured();
}

export const m365ConnectionStatus = {
  azureAd: isAzureAdConfigured,
  teams: isTeamsConfigured,
  sharePoint: isSharePointConfigured,
  outlook: isOutlookConfigured,
};
