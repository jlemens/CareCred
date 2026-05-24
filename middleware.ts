import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  readAuthExchangeParams,
  resolveAuthExchangeRedirect,
  stripAuthExchangeParams,
} from "@/lib/auth-exchange";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";

/**
 * Refresh Supabase sessions and exchange email-link codes (signup, recovery, etc.)
 * before route handlers / pages run.
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const { code, tokenHash, type } = readAuthExchangeParams(request.nextUrl.searchParams);

  if (code || (tokenHash && type)) {
    const nextPath = resolveAuthExchangeRedirect(
      request.nextUrl.pathname,
      request.nextUrl.searchParams,
    );
    const redirectTarget = stripAuthExchangeParams(request.nextUrl);
    redirectTarget.pathname = nextPath;

    let response = NextResponse.redirect(redirectTarget);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (!error) {
        return response;
      }
    }

    const errorTarget = stripAuthExchangeParams(request.nextUrl);
    errorTarget.pathname = PASSWORD_RESET_PATH;
    errorTarget.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(errorTarget);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
