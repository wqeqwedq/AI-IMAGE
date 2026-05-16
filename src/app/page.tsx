import { redirect } from "next/navigation";

type HomeSearchParams = { code?: string | string[]; next?: string | string[] };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : sp.code?.[0];
  if (code) {
    const nextVal = typeof sp.next === "string" ? sp.next : sp.next?.[0];
    const qs = new URLSearchParams({ code });
    if (nextVal) qs.set("next", nextVal);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  redirect("/login");
}
