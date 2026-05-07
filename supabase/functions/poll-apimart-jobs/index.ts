import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_POLLS = 120;

function firstResultUrl(data: Record<string, unknown>): string | null {
  const result = data.result as Record<string, unknown> | undefined;
  const images = result?.images as
    | Array<{ url?: string[] }>
    | undefined;
  const u = images?.[0]?.url;
  return u?.[0] ?? null;
}

Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const header = req.headers.get("x-cron-secret");
  if (!cronSecret || header !== cronSecret) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apimartKey = Deno.env.get("APIMART_API_KEY");
  if (!apimartKey) {
    return new Response("APIMART_API_KEY missing", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: jobs, error: qErr } = await admin
    .from("ai_image_generation_jobs")
    .select("id, external_task_id, poll_count")
    .eq("status", "polling")
    .order("updated_at", { ascending: true })
    .limit(50);

  if (qErr) {
    console.error("poll select", qErr);
    return new Response(JSON.stringify({ error: qErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();
  let processed = 0;

  for (const job of jobs ?? []) {
    processed++;
    const taskUrl = `https://api.apimart.ai/v1/tasks/${encodeURIComponent(
      job.external_task_id
    )}?language=zh`;

    let json: unknown;
    try {
      const res = await fetch(taskUrl, {
        headers: { Authorization: `Bearer ${apimartKey}` },
      });
      json = await res.json();
    } catch (e) {
      console.error("poll fetch", job.id, e);
      await admin
        .from("ai_image_generation_jobs")
        .update({
          poll_count: job.poll_count + 1,
          last_polled_at: now,
        })
        .eq("id", job.id);
      continue;
    }

    const root = json as Record<string, unknown>;
    if (root.code !== 200) {
      const nextCount = job.poll_count + 1;
      if (nextCount > MAX_POLLS) {
        await admin
          .from("ai_image_generation_jobs")
          .update({
            status: "failed",
            poll_count: nextCount,
            last_polled_at: now,
          })
          .eq("id", job.id);
      } else {
        await admin
          .from("ai_image_generation_jobs")
          .update({
            poll_count: nextCount,
            last_polled_at: now,
          })
          .eq("id", job.id);
      }
      continue;
    }

    const d = root.data as Record<string, unknown> | undefined;
    if (!d) {
      const nextCount = job.poll_count + 1;
      if (nextCount > MAX_POLLS) {
        await admin
          .from("ai_image_generation_jobs")
          .update({
            status: "failed",
            poll_count: nextCount,
            last_polled_at: now,
          })
          .eq("id", job.id);
      } else {
        await admin
          .from("ai_image_generation_jobs")
          .update({
            poll_count: nextCount,
            last_polled_at: now,
          })
          .eq("id", job.id);
      }
      continue;
    }

    const st = String(d.status ?? "");
    const nextCount = job.poll_count + 1;

    if (st === "completed") {
      const url = firstResultUrl(d);
      await admin
        .from("ai_image_generation_jobs")
        .update({
          status: "succeeded",
          result_url: url,
          poll_count: nextCount,
          last_polled_at: now,
        })
        .eq("id", job.id);
    } else if (st === "failed" || st === "cancelled") {
      await admin
        .from("ai_image_generation_jobs")
        .update({
          status: "failed",
          poll_count: nextCount,
          last_polled_at: now,
        })
        .eq("id", job.id);
    } else if (nextCount > MAX_POLLS) {
      await admin
        .from("ai_image_generation_jobs")
        .update({
          status: "failed",
          poll_count: nextCount,
          last_polled_at: now,
        })
        .eq("id", job.id);
    } else {
      await admin
        .from("ai_image_generation_jobs")
        .update({
          poll_count: nextCount,
          last_polled_at: now,
        })
        .eq("id", job.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed }), {
    headers: { "Content-Type": "application/json" },
  });
});
