/** Only allow same-origin paths when resuming an authentication flow. */
export function getSignInContinuation(search: string) {
  const params = new URLSearchParams(search);
  if (params.has("client_id") && params.get("response_type") === "code") {
    return `/api/auth/mcp/authorize?${params.toString()}`;
  }
  const callback = params.get("callbackURL");
  return callback?.startsWith("/") &&
    !callback.startsWith("//") &&
    !Array.from(callback).some(
      (character) =>
        character.charCodeAt(0) <= 32 ||
        character.charCodeAt(0) === 127 ||
        character === "\\",
    )
    ? callback
    : "/";
}
