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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signupAction } from "@/app/actions/auth-actions";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { GoogleSignin } from "./google-signin";
import { GithubSignin } from "./github-signin";
import { useAuthBrandPanel } from "@/components/login/auth-brand-panel-context";

export const SignUpForm = () => {
  const { patch } = useAuthBrandPanel();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const toastId = useId();
  const signUpFormT = useTranslations("login.signUpForm");
  const formSchema = z
    .object({
      fullName: z.string().min(3, {
        message: signUpFormT("fullNameMessage"),
      }),
      email: z.string().email({
        message: signUpFormT("emailMessage"),
      }),
      password: z
        .string({
          required_error: signUpFormT("passwordString"),
        })
        .min(8, {
          message: signUpFormT("passwordMin"),
        }),
      confirmPassword: z.string({
        required_error: signUpFormT("confirmPasswordInfo"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: signUpFormT("passwordRefine"),
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
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
    setLoading(true);
    toast.loading(signUpFormT("info1"), { id: toastId });
    const formData = new FormData();
    formData.append("fullName", values.fullName);
    formData.append("email", values.email);
    formData.append("password", values.password);

    const result = await signupAction(formData);
    if (!result.success) {
      toast.error(String(result.error), { id: toastId });
    } else if (result.pendingEmailVerification) {
      toast.success(signUpFormT("infoVerifyEmailTitle"), {
        id: toastId,
        duration: 12_000,
        description: signUpFormT("infoVerifyEmailDesc"),
      });
      redirect("/login");
    } else {
      toast.success(signUpFormT("info2"), { id: toastId });
      redirect("/login");
    }
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {signUpFormT("name")}
        </h1>
        <p className="text-sm text-gray-400">{signUpFormT("title1")}</p>
      </div>
      <div>
        <div className={cn("grid gap-6")}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{signUpFormT("fullName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={signUpFormT("fullNameInfo")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{signUpFormT("email")}</FormLabel>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{signUpFormT("password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPwd ? "text" : "password"}
                          placeholder={signUpFormT("passwordInfo")}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{signUpFormT("confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type={showPwd ? "text" : "password"}
                        placeholder={signUpFormT("confirmPasswordEnter")}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {signUpFormT("btn1")}
              </Button>
              <div className="flex gap-4">
                <GoogleSignin />
                <GithubSignin />
              </div>
            </form>
          </Form>
        </div>
        <div className="text-center flex items-center justify-center">
          <Link href={"/login"}>
            <Button variant={"link"} className="p-0">
              {signUpFormT("btn2")}
            </Button>
          </Link>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          {signUpFormT("btn3")}
          <Link
            href={"#"}
            className="underline underline-offset-4 hover:text-primary"
          >
            {signUpFormT("btn4")}
          </Link>
          {signUpFormT("btn5")}
          <Link
            href={"#"}
            className="underline underline-offset-4 hover:text-primary"
          >
            {signUpFormT("btn6")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
