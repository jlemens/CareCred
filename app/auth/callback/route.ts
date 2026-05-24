import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  readAuthExchangeParams,
  resolveAuthExchangeRedirect,
  stripAuthExchangeParams,
} from "@/lib/auth-exchange";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { code, tokenHash, type } = readAuthExchangeParams(requestUrl.searchParams);
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(
    new URL(`${PASSWORD_RESET_PATH}?error=invalid_link`, requestUrl.origin),
  );
}
