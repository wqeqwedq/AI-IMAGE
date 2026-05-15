"use client";
import React, { useEffect, useId, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/actions/auth-actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthBrandPanel } from "@/components/login/auth-brand-panel-context";

export const ChangePassword = () => {
  const { patch } = useAuthBrandPanel();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const toastId = useId();
  const changePasswordT = useTranslations("account.changePassword");
  const formSchema = z
    .object({
      password: z.string().min(8, {
        message: changePasswordT("passwordMessage"),
      }),
      confirmPassword: z.string({
        required_error: changePasswordT("passwordConfirmPassword"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: changePasswordT("passwordRefine"),
      path: ["confirmPassword"],
    });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const watchedPassword = form.watch("password");
  const watchedConfirm = form.watch("confirmPassword");

  useEffect(() => {
    patch({
      password: watchedPassword ?? "",
      confirmPassword: watchedConfirm ?? "",
      showPassword: showPwd,
    });
  }, [watchedPassword, watchedConfirm, showPwd, patch]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    toast.loading(changePasswordT("infoLoading"), { id: toastId });
    setLoading(true);

    try {
      const { success, error } = await changePasswordAction(values.password);
      if (!success) {
        toast.error(String(error), { id: toastId });
        setLoading(false);
      } else {
        toast.success(changePasswordT("infoSuccess"), { id: toastId });
        setLoading(false);
        router.push("/login");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : String(error),
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={cn("grid gap-6")}>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {changePasswordT("name")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {changePasswordT("desc")}
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel> {changePasswordT("password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  {changePasswordT("passwordDesc")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{changePasswordT("confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {changePasswordT("confirmPasswordDesc")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full p-4">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading
              ? changePasswordT("loading1")
              : changePasswordT("loading2")}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            {changePasswordT("info")}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ChangePassword;
