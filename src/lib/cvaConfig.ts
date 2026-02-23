const DEFAULT_CVA_BASE_URL = "https://stroke.dev.qualityregistry.org/api/rest/cva/v1";

export function getCvaBaseUrl(): string {
  const configured = process.env.CVA_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return DEFAULT_CVA_BASE_URL;
}
