"use server";
import type { GenerateImageSubmitPayload } from "@/components/image-generation/config-urations";
import { createServer } from "@/lib/supabase/server";
import { Database } from "@datatypes.types";
import { imageMeta } from "image-meta";
import { randomUUID } from "crypto";
import { getCreditsAction } from "./credits-action";
import { generationCreditsForResolution } from "@/lib/generation-params";

export interface ImageResponse {
  error: string | null;
  success: boolean;
  data: string[] | null;
  job_id: string | null;
}

export const generateImageAction = async (
  input: GenerateImageSubmitPayload
): Promise<ImageResponse> => {
  const supabase = await createServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: "Unauthorized", success: false, data: null, job_id: null };
  }

  const { data: credits } = await getCreditsAction();
  const creditCost = generationCreditsForResolution(input.resolution ?? "1k");
  const balance = credits?.image_generation_count ?? 0;
  if (balance < creditCost) {
    return {
      error: "No credits availabel",
      success: false,
      data: null,
      job_id: null,
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return {
      error: "SUPABASE_URL or SUPABASE_ANON_KEY is not configured",
      success: false,
      data: null,
      job_id: null,
    };
  }

  const createJobUrl = `${supabaseUrl}/functions/v1/create-generation-job`;

  const { preset_id: _presetId, ...body } = input;
  void _presetId;

  try {
    const res = await fetch(createJobUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
    });

    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      return {
        error: "Generation API returned non-JSON response",
        success: false,
        data: null,
        job_id: null,
      };
    }

    if (!res.ok) {
      const msg =
        typeof parsed === "object" && parsed && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : res.statusText;
      return {
        error: msg || `HTTP ${res.status}`,
        success: false,
        data: null,
        job_id: null,
      };
    }

    const jobId =
      typeof parsed === "object" &&
      parsed &&
      "job_id" in parsed &&
      typeof (parsed as { job_id: unknown }).job_id === "string"
        ? (parsed as { job_id: string }).job_id
        : null;

    if (!jobId) {
      return {
        error: "Generation API returned no job_id",
        success: false,
        data: null,
        job_id: null,
      };
    }

    return { error: null, success: true, data: null, job_id: jobId };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { error: msg, success: false, data: null, job_id: null };
  }
};

export type GenerationJobRow = Pick<
  Database["public"]["Tables"]["ai_image_generation_jobs"]["Row"],
  "id" | "status" | "result_url"
>;

export const getGenerationJobAction = async (
  jobId: string
): Promise<{
  error: string | null;
  success: boolean;
  data: GenerationJobRow | null;
}> => {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized", success: false, data: null };
  }

  const { data, error } = await supabase
    .from("ai_image_generation_jobs")
    .select("id, status, result_url")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return {
      error: error.message || "Failed to load job",
      success: false,
      data: null,
    };
  }
  if (!data) {
    return { error: "Job not found", success: false, data: null };
  }

  return { error: null, success: true, data };
};

/** 画廊 / 仪表盘：异步任务成功记录（仅展示用） */
export type GenerationJobGalleryItem = {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
};

function promptFromJobPayload(payload: unknown): string {
  if (payload && typeof payload === "object" && "prompt" in payload) {
    const p = (payload as Record<string, unknown>).prompt;
    return typeof p === "string" ? p : "";
  }
  return "";
}

export const getSucceededGenerationJobsGalleryAction = async (
  limit?: number
): Promise<{
  error: string | null;
  success: boolean;
  data: GenerationJobGalleryItem[] | null;
}> => {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized", success: false, data: null };
  }

  let query = supabase
    .from("ai_image_generation_jobs")
    .select("id, result_url, request_payload, created_at")
    .eq("user_id", user.id)
    .eq("status", "succeeded")
    .not("result_url", "is", null)
    .order("created_at", { ascending: false });

  if (limit != null && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    return {
      error: error.message || "Failed to fetch gallery jobs",
      success: false,
      data: null,
    };
  }

  const items: GenerationJobGalleryItem[] = (data ?? [])
    .filter((row) => row.result_url)
    .map((row) => ({
      id: row.id,
      url: row.result_url as string,
      prompt: promptFromJobPayload(row.request_payload),
      created_at: row.created_at,
    }));

  return { error: null, success: true, data: items };
};

export const deleteGenerationJobAction = async (jobId: string) => {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized", success: false, data: null };
  }

  const { error } = await supabase
    .from("ai_image_generation_jobs")
    .delete()
    .eq("id", jobId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message, success: false, data: null };
  }
  return { error: null, success: true, data: true };
};

type storeImageinput = {
  url: string;
  model?: string | null;
  prompt?: string | null;
  size?: string;
  resolution?: string;
  image_urls?: string[];
} & Database["public"]["Tables"]["ai_image_generated_images"]["Insert"];

export const imgUrlToBlob = async (url: string) => {
  const resposne = fetch(url);
  const blob = (await resposne).blob();
  return (await blob).arrayBuffer();
};

export const storeImagesAction = async (data: storeImageinput[]) => {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Unauthorized",
      success: false,
      data: null,
    };
  }
  const uploadResults = [];

  for (const img of data) {
    const arrayBuffer = await imgUrlToBlob(img.url);
    const { width, height, type } = imageMeta(new Uint8Array(arrayBuffer));
    const fileName = `image_${randomUUID()}.${type}`;
    const filePath = `${user.id}/${fileName}`;
    const { error: storageError } = await supabase.storage
      .from("ai_image_generated_images")
      .upload(filePath, arrayBuffer, {
        contentType: `image/${type}`,
        cacheControl: "3600",
        upsert: false,
      });
    if (storageError) {
      uploadResults.push({
        fileName,
        error: storageError.message,
        success: false,
        data: null,
      });
      continue;
    }

    const aspectLabel =
      img.size && img.resolution
        ? `${img.size} · ${img.resolution}`
        : img.aspect_ratio ?? null;

    const { data: dbData, error: dbError } = await supabase
      .from("ai_image_generated_images")
      .insert([
        {
          user_id: user.id,
          model: img.model ?? null,
          prompt: img.prompt ?? null,
          aspect_ratio: aspectLabel,
          guidance: null,
          num_inference_steps: null,
          output_format: img.image_urls?.length ? "img2img" : "txt2img",
          image_name: fileName,
          width,
          height,
        },
      ])
      .select();
    if (dbError) {
      uploadResults.push({
        fileName,
        error: dbError.message,
        success: !dbData,
        data: dbData || null,
      });
    }
  }
  return {
    error: null,
    success: true,
    data: {
      results: uploadResults,
    },
  };
};

export const getImagesAction = async (limit?: number) => {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Unauthorized",
      success: false,
      data: null,
    };
  }
  let query = supabase
    .from("ai_image_generated_images")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (limit) {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  if (error) {
    return {
      error: error.message || "Failed to fetch images!",
      success: false,
      data: null,
    };
  }
  const imageWithUrl = await Promise.all(
    data.map(
      async (
        image: Database["public"]["Tables"]["ai_image_generated_images"]["Insert"]
      ) => {
        const { data: selData, error: selError } = await supabase.storage
          .from("ai_image_generated_images")
          .createSignedUrl(`${user.id}/${image.image_name}`, 3600);
        return {
          ...image,
          url: selData?.signedUrl,
        };
      }
    )
  );

  return {
    error: null,
    success: true,
    data: imageWithUrl,
  };
};

export const deleteImageAction = async (id: string, imageName: string | null) => {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Unauthorized",
      success: false,
      data: null,
    };
  }
  const { data, error } = await supabase
    .from("ai_image_generated_images")
    .delete()
    .eq("id", id);
  if (error) {
    return {
      error: error.message,
      success: false,
      data: null,
    };
  }
  await supabase.storage
    .from("ai_image_generated_images")
    .remove([`${user?.id}/${imageName}`]);
  return {
    error: null,
    success: true,
    data: data,
  };
};
