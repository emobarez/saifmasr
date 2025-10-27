
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      if (result?.error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
      } else if (result?.ok) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بعودتك!",
        });
        // Don't set loading to false - let the redirect happen
        // The page will change, so we don't need to update loading state
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "يرجى التحقق من بريدك الإلكتروني وكلمة المرور.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="تسجيل الدخول"
      description="أدخل بياناتك للوصول إلى حسابك."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input id="email" type="email" placeholder="your@example.com" {...field} />
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
                <FormLabel htmlFor="password">كلمة المرور</FormLabel>
                <FormControl>
                  <Input id="password" type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
            {isLoading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          أنشئ حساباً جديداً
        </Link>
      </p>
    </AuthLayout>
  );
}
