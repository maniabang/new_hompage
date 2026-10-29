export {};
const base = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const response = await fetch(`${base}/storage/v1/bucket`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: "cutdesk",
    name: "cutdesk",
    public: false,
    file_size_limit: 52428800,
    allowed_mime_types: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "audio/wav",
      "audio/mpeg",
      "audio/mp4",
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "application/gzip",
    ],
  }),
});
if (!response.ok && response.status !== 409) {
  const d = await response.json();
  if (!String(d.message ?? d.error).includes("already exists"))
    throw new Error(
      `Storage initialization failed (${response.status}): ${d.message ?? d.error}`,
    );
}
console.log("Private cutdesk storage bucket ready.");
