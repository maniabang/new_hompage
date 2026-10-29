// Private server setting. Missing or unrecognized values keep the public portfolio.
export function siteMode(): "portfolio" | "cutdesk" {
  return process.env.SITE_MODE === "cutdesk" ? "cutdesk" : "portfolio";
}
