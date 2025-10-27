
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";

const registerSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { signUp } = useAuth(); // signUp now expects (name, email, password)
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await signUp(data.name, data.email, data.password); 
      // Navigation handled by AuthContext
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول.",
      });
    } catch (error: any) {
      let errorMessage = "حدث خطأ ما. يرجى المحاولة مرة أخرى.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "خطأ في إنشاء الحساب",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="إنشاء حساب جديد"
      description="املأ النموذج أدناه للانضمام إلى بوابتنا."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
           <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="name">الاسم الكامل</FormLabel>
                <FormControl>
                  <Input id="name" placeholder="اسمك الكامل" {...field} />
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
           <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="confirmPassword">تأكيد كلمة المرور</FormLabel>
                <FormControl>
                  <Input id="confirmPassword" type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
             {isLoading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
}
