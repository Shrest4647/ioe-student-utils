/** Preserve exact callback URLs: OAuth compares these byte for byte. */
export function validateRedirectUri(value: string): string | null {
  try {
    if (/\s/.test(value)) return "Callback URLs cannot contain whitespace.";
    const url = new URL(value);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
      return "Use an HTTPS callback URL, or HTTP on localhost for development.";
    }
    if (
      url.username ||
      url.password ||
      url.hash ||
      value.includes("#") ||
      value.includes(",")
    ) {
      return "Callback URLs cannot contain credentials, fragments, or commas.";
    }
    return null;
  } catch {
    return "Enter the complete callback URL copied from your AI app.";
  }
}
