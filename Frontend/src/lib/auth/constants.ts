export const SESSION_COOKIE = "session"
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// Holds the raw backend JWT — separate from SESSION_COOKIE (display info
// only) so server-side code can attach it to backend requests without ever
// needing to decode/trust the session cookie's contents.
export const ACCESS_TOKEN_COOKIE = "access_token"

export const PUBLIC_PATHS = ["/login"]
