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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const authParams = readAuthExchangeParams(requestUrl.searchParams);
  const supabaseAuthError = readSupabaseAuthError(requestUrl.searchParams);

  if (supabaseAuthError && !authParams.code && !authParams.tokenHash) {
    return NextResponse.redirect(
      new URL(
        `${PASSWORD_RESET_PATH}?error=invalid_link&message=${encodeURIComponent(supabaseAuthError)}`,
        requestUrl.origin,
      ),
    );
  }

  const nextPath = resolveAuthExchangeRedirect(
    requestUrl.pathname,
    requestUrl.searchParams,
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL(`${PASSWORD_RESET_PATH}?error=config`, requestUrl.origin),
    );
  }

  const redirectTarget = stripAuthExchangeParams(requestUrl);
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

  if (authParams.code || authParams.tokenHash) {
    const { error } = await exchangeEmailLinkAuth(supabase, authParams);
    if (!error) {
      return response;
    }
  }

  const errorTarget = stripAuthExchangeParams(requestUrl);
  errorTarget.pathname = PASSWORD_RESET_PATH;
  errorTarget.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(errorTarget);
}
