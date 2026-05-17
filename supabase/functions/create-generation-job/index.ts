import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const PRESET_REFS_BUCKET = "ai_image_preset_refs";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ApimartBody = {
  model: string;
  prompt: string;
  n: number;
  size: string;
  resolution: string;
  image_urls?: string[];
};

function firstResultUrl(data: Record<string, unknown>): string | null {
  const result = data.result as Record<string, unknown> | undefined;
  const images = result?.images as
    | Array<{ url?: string[] }>
    | undefined;
  const u = images?.[0]?.url;
  return u?.[0] ?? null;
}

/** Apimart 部分接口 code 为数字或字符串 */
function apimartCodeOk(code: unknown): boolean {
  const n = Number(code);
  return n === 200;
}

/** 官方格式：task_id；旧示例为 id */
function pickTaskIdFromObject(o: Record<string, unknown>): string {
  const keys = ["task_id", "taskId", "id"];
  for (const k of keys) {
    const v = o[k];
    if (v != null && typeof v !== "object" && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
}

/**
 * Apimart 当前文档：data 为数组，元素含 task_id、status（如 submitted）。
 * 兼容旧版：data 为单对象且含 id / task_id。
 */
function getPrimaryApimartTaskRecord(
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
  const rawResult = root.result;
  if (rawResult && typeof rawResult === "object" && !Array.isArray(rawResult)) {
    return rawResult as Record<string, unknown>;
  }
  return undefined;
}

/** 校验客户端传入的待清理路径（仅允许当前用户在本桶下的对象） */
function sanitizeCleanupRefPaths(raw: unknown, userId: string): string[] {
  if (!Array.isArray(raw)) return [];
  const paths = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const path = item.trim();
    if (!path || path.includes("..")) continue;
    if (!path.startsWith(`${userId}/`)) continue;
    paths.add(path);
  }
  return [...paths];
}

async function deleteOwnPresetRefObjects(
  admin: SupabaseClient,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await admin.storage.from(PRESET_REFS_BUCKET).remove(paths);
  if (error) {
    console.error(
      "create-generation-job: failed to delete preset ref objects",
      error.message,
      paths
    );
  }
}

function extractApimartTaskId(root: Record<string, unknown>): string {
  const rawData = root.data;
  if (Array.isArray(rawData)) {
    for (const item of rawData) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const id = pickTaskIdFromObject(item as Record<string, unknown>);
        if (id) return id;
      }
    }
  }

  const primary = getPrimaryApimartTaskRecord(root);
  if (primary) {
    const id = pickTaskIdFromObject(primary);
    if (id) return id;
    const inner = primary.data;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const id2 = pickTaskIdFromObject(inner as Record<string, unknown>);
      if (id2) return id2;
    }
  }

  for (const k of ["task_id", "taskId", "id"]) {
    const v = root[k];
    if (v != null && typeof v !== "object" && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apimartKey = Deno.env.get("APIMART_API_KEY");

  if (!apimartKey) {
    return new Response(
      JSON.stringify({ error: "APIMART_API_KEY is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const presetId = body.preset_id;
  void presetId;

  const payload: ApimartBody = {
    model: String(body.model ?? "gpt-image-2"),
    prompt: String(body.prompt ?? ""),
    n: Number(body.n ?? 1),
    size: String(body.size ?? "1:1"),
    resolution: String(body.resolution ?? "1k"),
    image_urls: Array.isArray(body.image_urls)
      ? (body.image_urls as string[])
      : [],
  };

  if (!payload.prompt.trim()) {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apimartRes = await fetch(
    "https://api.apimart.ai/v1/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apimartKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: payload.model,
        prompt: payload.prompt,
        n: payload.n,
        size: payload.size,
        resolution: payload.resolution,
        image_urls: payload.image_urls ?? [],
      }),
    }
  );

  let apimartJson: unknown;
  try {
    apimartJson = await apimartRes.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Apimart returned non-JSON" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const root = apimartJson as Record<string, unknown>;
  if (!apimartRes.ok) {
    console.error(
      "create-generation-job: Apimart HTTP",
      apimartRes.status,
      JSON.stringify(root).slice(0, 2000)
    );
    return new Response(
      JSON.stringify({
        error: "Apimart HTTP error",
        status: apimartRes.status,
        details: root,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!apimartCodeOk(root.code)) {
    return new Response(
      JSON.stringify({
        error: "Apimart error",
        details: root,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const taskId = extractApimartTaskId(root);
  const data = getPrimaryApimartTaskRecord(root);

  if (!taskId) {
    console.error(
      "create-generation-job: Apimart success body but no task id",
      JSON.stringify(root).slice(0, 4000)
    );
    return new Response(
      JSON.stringify({
        error: "Apimart response missing task id",
        details: root,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const requestSnapshot = {
    model: payload.model,
    prompt: payload.prompt,
    n: payload.n,
    size: payload.size,
    resolution: payload.resolution,
    image_urls: payload.image_urls ?? [],
  };

  let immediateUrl: string | null = null;
  if (data?.status === "completed") {
    immediateUrl = firstResultUrl(data);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const refPathsToDelete = sanitizeCleanupRefPaths(
    body.cleanup_ref_paths,
    user.id
  );

  const { data: jobId, error: rpcErr } = await admin.rpc(
    "ai_image_start_generation_job",
    {
      p_user_id: user.id,
      p_external_task_id: taskId,
      p_request_payload: requestSnapshot,
      p_result_url: immediateUrl,
    }
  );

  // Apimart 已受理任务（已有 task_id），可清理桶内临时参考图；删除失败不阻断主流程
  await deleteOwnPresetRefObjects(admin, refPathsToDelete);

  if (rpcErr) {
    console.error("ai_image_start_generation_job", rpcErr);
    return new Response(
      JSON.stringify({
        error: rpcErr.message ?? "Failed to persist job",
        code: rpcErr.code,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ job_id: jobId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
