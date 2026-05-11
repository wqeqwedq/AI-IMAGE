import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type PollingJob = {
  id: string;
  external_task_id: string;
  poll_count: number;
};

function firstResultUrl(data: Record<string, unknown>): string | null {
  const result = data.result as Record<string, unknown> | undefined;
  const images = result?.images as
    | Array<{ url?: string[] }>
    | undefined;
  const u = images?.[0]?.url;
  return u?.[0] ?? null;
}

async function settleJob(
  admin: ReturnType<typeof createClient>,
  jobId: string,
  success: boolean,
  resultUrl: string | null
): Promise<void> {
  const { error } = await admin.rpc("ai_image_settle_generation_job", {
    p_job_id: jobId,
    p_success: success,
    p_result_url: resultUrl ?? "",
  });
  if (error) {
    console.error("ai_image_settle_generation_job", jobId, error);
  }
}

/** 与 create-generation-job 一致：GET /tasks 的 data 多为单对象，兼容数组首项 */
function getTaskRecord(
  root: Record<string, unknown>
): Record<string, unknown> | undefined {
  const raw = root.data;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
    return undefined;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return undefined;
}

async function bumpJobPoll(
  admin: ReturnType<typeof createClient>,
  job: PollingJob,
  now: string
): Promise<void> {
  await admin
    .from("ai_image_generation_jobs")
    .update({
      poll_count: job.poll_count + 1,
      last_polled_at: now,
    })
    .eq("id", job.id);
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

  for (const raw of jobs ?? []) {
    processed++;
    const job = raw as PollingJob;

    const taskUrl = `https://api.apimart.ai/v1/tasks/${encodeURIComponent(
      job.external_task_id
    )}?language=zh`;

    let json: unknown;
    try {
      const res = await fetch(taskUrl, {
        headers: { Authorization: `Bearer ${apimartKey}` },
      });

      // 网络 / HTTP 异常不算「任务失败」：继续轮询直至 Apimart data.status 终态
      if (!res.ok) {
        console.warn("poll HTTP (retry)", job.id, res.status);
        await bumpJobPoll(admin, job, now);
        continue;
      }

      json = await res.json();
    } catch (e) {
      console.error("poll fetch/json", job.id, e);
      await bumpJobPoll(admin, job, now);
      continue;
    }

    const root = json as Record<string, unknown>;
    const d = getTaskRecord(root);
    if (!d) {
      console.warn("poll no task record (retry)", job.id, root.code);
      await bumpJobPoll(admin, job, now);
      continue;
    }

    const st = String(d.status ?? "");

    if (st === "completed") {
      const url = firstResultUrl(d);
      if (url) {
        await settleJob(admin, job.id, true, url);
      } else {
        await settleJob(admin, job.id, false, null);
      }
    } else if (st === "failed" || st === "cancelled") {
      await settleJob(admin, job.id, false, null);
    } else {
      // pending / processing / submitted 等：服务端未报任务失败，继续轮询
      await bumpJobPoll(admin, job, now);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed }), {
    headers: { "Content-Type": "application/json" },
  });
});
