import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_EMAIL = "a.giraudon@astem.fr"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const supabase = createMiddlewareClient({ req: request, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/admin/:path*"],
}
```
