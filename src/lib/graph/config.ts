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
