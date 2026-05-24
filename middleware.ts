import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeEmailLinkAuth,
  readAuthExchangeParams,
  readSupabaseAuthError,
  resolveAuthExchangeRedirect,
  stripAuthExchangeParams,
} from "@/lib/auth-exchange";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";

/**
 * Refresh Supabase sessions and exchange email-link tokens before pages run.
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const authParams = readAuthExchangeParams(request.nextUrl.searchParams);
  const supabaseAuthError = readSupabaseAuthError(request.nextUrl.searchParams);

  if (supabaseAuthError && !authParams.code && !authParams.tokenHash) {
    return NextResponse.redirect(
      new URL(
        `${PASSWORD_RESET_PATH}?error=invalid_link&message=${encodeURIComponent(supabaseAuthError)}`,
        request.nextUrl.origin,
      ),
    );
  }

  if (authParams.code || (authParams.tokenHash && authParams.type)) {
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

    const { error } = await exchangeEmailLinkAuth(supabase, authParams);
    if (!error) {
      return response;
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
