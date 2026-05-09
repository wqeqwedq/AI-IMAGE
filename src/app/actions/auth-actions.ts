"use server"

import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthResponse {
    error: null | string;
    success: boolean;
    data: unknown | null;
    /** 注册成功但需点击邮件链接验证邮箱（无 session） */
    pendingEmailVerification?: boolean;
    /** 登录失败：邮箱尚未在邮件中确认 */
    emailNotConfirmed?: boolean;
}

export const signupAction = async (formData: FormData): Promise<AuthResponse> => {
    const supbase = await createServer();
    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        options: {
            data: {
                fullName: formData.get("fullName") as string,
            }
        }
    }

    const { data: signupData, error } = await supbase.auth.signUp(data)

    if (error) {
        return {
            error: error.message,
            success: false,
            data: null,
        }
    }

    const pendingEmailVerification = Boolean(
        signupData?.user && !signupData.session
    );

    return {
        error: null,
        success: true,
        data: signupData || null,
        pendingEmailVerification,
    }

}

export const loginAction = async (formData: FormData): Promise<AuthResponse> => {
    const supbase = await createServer();
    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    }
    const { data: signinData, error } = await supbase.auth.signInWithPassword(data)

    if (error) {
        const code = "code" in error ? (error as { code?: string }).code : undefined;
        const msg = error.message ?? "";
        const emailNotConfirmed =
            code === "email_not_confirmed" ||
            /email not confirmed|not confirmed/i.test(msg) ||
            /邮箱.*确认|尚未确认|未验证|验证邮箱/i.test(msg);

        return {
            error: error.message,
            success: false,
            data: null,
            emailNotConfirmed,
        }
    }

    return {
        error: null,
        success: true,
        data: signinData || null,
    }

}

export const logoutAction = async (): Promise<void> => {
    const supbase = await createServer();
    await supbase.auth.signOut()
    redirect("/login")

}

export const updateProfileAction = async ({ fullName }: { fullName: string }): Promise<AuthResponse> => {
    const supbase = await createServer();

    const { data: profleData, error } = await supbase.auth.updateUser({
        data: { fullName }
    })

    return {
        error: error?.message || "There was an error updating the profile",
        success: !error,
        data: profleData || null
    }

}

export const resetPasswordAction = async ({ email }: { email: string }): Promise<AuthResponse> => {
    const supbase = await createServer();

    const { data: profleData, error } = await supbase.auth.resetPasswordForEmail(email)

    return {
        error: error?.message || "There was an error sending the reset password email!",
        success: !error,
        data: profleData || null
    }

}

export const changePasswordAction = async (newPassword: string): Promise<AuthResponse> => {
    const supbase = await createServer();
    const { data, error } = await supbase.auth.updateUser({
        password: newPassword
    })
    return {
        error: error?.message || "There was an error changing the password!",
        success: !error,
        data: data || null
    }

}

