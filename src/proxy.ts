export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|signin|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|icon-192.png|icon-512.png|apple-icon|.*\\.svg$).*)",
  ],
};
