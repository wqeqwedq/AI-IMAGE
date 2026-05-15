"use client";
import React, { useEffect, useId, useState } from "react";
import {
  Form,
  FormControl,
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
import { toast } from "sonner";
import { resetPasswordAction } from "@/app/actions/auth-actions";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuthBrandPanel } from "@/components/login/auth-brand-panel-context";

export const ResetPassword = () => {
  const { patch } = useAuthBrandPanel();
  const [loading, setLoading] = useState(false);
  const toastId = useId();
  const resetPasswordT = useTranslations("login.resetPassword");
  const formSchema = z.object({
    email: z.string().email({
      message: resetPasswordT("emailMessage"),
    }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    patch({
      password: "",
      confirmPassword: "",
      showPassword: false,
      isTyping: false,
    });
  }, [patch]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    toast.loading(resetPasswordT("infoLoading"), { id: toastId });
    try {
      const { success, error } = await resetPasswordAction({
        email: values?.email || "",
      });
      if (!success) {
        toast.error(error, { id: toastId });
      } else {
        toast.success(resetPasswordT("infoSuccess"), { id: toastId });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : resetPasswordT("infoError");
      toast.error(message, {
        id: toastId,
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {resetPasswordT("name")}
        </h1>
        <p className="text-sm text-gray-400">{resetPasswordT("title1")}</p>
      </div>

      <div className={cn("grid gap-6")}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{resetPasswordT("email")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@ecample.com"
                      autoComplete="email"
                      {...field}
                      onFocus={() => {
                        patch({ isTyping: true });
                      }}
                      onBlur={() => {
                        field.onBlur();
                        patch({ isTyping: false });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {resetPasswordT("btn1")}
            </Button>
          </form>
        </Form>
      </div>
      <div className="text-center">
        <Link href={"/login"}>
          <Button variant={"link"} className="p-0 text-black">
            {resetPasswordT("btn2")}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
