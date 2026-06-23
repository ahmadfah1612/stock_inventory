import { auth } from "@/lib/auth";
export default auth((req) => {
  const onLogin = req.nextUrl.pathname.startsWith("/login");
  if (!req.auth && !onLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
