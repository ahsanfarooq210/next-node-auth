import { auth } from "../auth";

export default auth((req) => {
  // Check if the route starts with /dashboard
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  // If user is not authenticated and tries to access dashboard routes
  if (!req.auth && isDashboardRoute) {
    const newUrl = new URL("/signin", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  // Match all routes except api routes, static files, images, and favicon
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
