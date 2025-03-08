/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to `DEFAULT_LOGIN_REDIRECT`
 */
export const authRoutes = ["/login", "/signup", "/reset-password"];

/**
 * The default redirect path after a user logs in
 */
export const DEFAULT_LOGIN_REDIRECT = "/";

/**
 * An array of main app routes for the application
 */
export const appRoutes = [
  "/",
  "/artist",
  "/shows",
  "/search",
  "/my/setlists",
  "/my-spotify-artists",
];

/**
 * An array of user routes for the application
 */
export const userRoutes = ["/my", "/settings"];
