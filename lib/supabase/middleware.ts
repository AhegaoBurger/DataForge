import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect app routes (dashboard, bounties, marketplace, profile)
  const protectedPaths = [
    "/dashboard",
    "/bounties",
    "/marketplace",
    "/profile",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Ensure user has a profile when accessing protected routes
  if (user && isProtectedPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create it
    if (!profile) {
      const displayName =
        user.user_metadata?.display_name ||
        user.user_metadata?.name ||
        `User ${user.id.slice(0, 8)}`;

      await supabase.from("profiles").insert({
        id: user.id,
        display_name: displayName,
        wallet_address: user.user_metadata?.wallet_address || null,
      });
    }
  }

  return supabaseResponse;
}
