import { create } from "zustand";
import type {
  GenerateImageSubmitPayload,
} from "@/components/image-generation/config-urations";

export type GeneratedImageWithUrl = GenerateImageSubmitPayload & { url: string };
import {
  generateImageAction,
  getGenerationJobAction,
} from "@/app/actions/image-action";
import { toast } from "sonner";

const pollIntervalMs = 2000;
const maxPolls = 180;

type GeneratedSetState = {
  (
    partial:
      | Partial<GeneratedState>
      | ((state: GeneratedState) => Partial<GeneratedState>)
  ): void;
};

interface GeneratedState {
  loading: boolean;
  images: GeneratedImageWithUrl[];
  error: string | null;
  generateImage: (values: GenerateImageSubmitPayload) => Promise<void>;
}

async function pollGenerationJobInBackground(
  jobId: string,
  values: GenerateImageSubmitPayload,
  toastId: string | number,
  set: GeneratedSetState
): Promise<void> {
  try {
    for (let i = 0; i < maxPolls; i++) {
      const job = await getGenerationJobAction(jobId);
      if (!job.success || !job.data) {
        toast.error(job.error ?? "Failed to load job status", {
          id: toastId,
        });
        set({
          error: job.error ?? "Failed to load job status",
        });
        return;
      }

      const { status, result_url } = job.data;
      if (status === "succeeded" && result_url) {
        const dataUrl: GeneratedImageWithUrl[] = [
          { ...values, url: result_url },
        ];
        toast.success("Image generated successfully!", { id: toastId });
        set({ images: dataUrl, error: null });
        return;
      }
      if (status === "failed") {
        toast.error("Image generation failed", { id: toastId });
        set({ error: "Image generation failed" });
        return;
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    toast.error("Generation timed out. Check again later.", {
      id: toastId,
    });
    set({
      error: "Generation timed out. Check again later.",
    });
  } catch {
    set({
      error: "Failed to generate image. Please try again",
    });
    toast.error("Failed to generate image. Please try again", {
      id: toastId,
    });
  }
}

const useGeneratedStore = create<GeneratedState>((set) => ({
  loading: false,
  images: [],
  error: null,
  generateImage: async (values: GenerateImageSubmitPayload) => {
    set({ loading: true, error: null });
    const toastId = toast.loading("Starting generation…");

    try {
      const { error, success, job_id } = await generateImageAction(values);
      if (!success || !job_id) {
        toast.error(error ?? "Generation failed", { id: toastId });
        set({ error: error ?? "Generation failed", loading: false });
        return;
      }

      toast.loading("Generating image…", { id: toastId });
      set({ loading: false });

      void pollGenerationJobInBackground(job_id, values, toastId, set);
    } catch {
      set({
        error: "Failed to generate image. Please try again",
        loading: false,
      });
      toast.error("Failed to generate image. Please try again", {
        id: toastId,
      });
    }
  },
}));

export default useGeneratedStore;
