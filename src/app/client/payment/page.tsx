"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Smartphone, Wallet, Copy, CheckCircle2, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "vodafone" | "instapay" | null;

const PAYMENT_NUMBER = "01000220829";

export default function PaymentPage() {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الرقم بنجاح",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الدفع الإلكتروني</h1>
        <p className="text-muted-foreground mt-2">
          اختر طريقة الدفع المفضلة لديك وقم بالتحويل على الرقم المحدد
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle>اختر طريقة الدفع</CardTitle>
            <CardDescription>حدد الخيار المناسب لإتمام الدفع</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedMethod || ""}
              onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            >
              <div className="space-y-3">
                {/* Vodafone Cash */}
                <div
                  className={`flex items-center space-x-2 space-x-reverse border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === "vodafone"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedMethod("vodafone")}
                >
                  <RadioGroupItem value="vodafone" id="vodafone" />
                  <Label
                    htmlFor="vodafone"
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Smartphone className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">فودافون كاش</p>
                      <p className="text-xs text-muted-foreground">
                        ادفع باستخدام محفظة فودافون كاش
                      </p>
                    </div>
                    <Badge variant="secondary">شائع</Badge>
                  </Label>
                </div>

                {/* InstaPay */}
                <div
                  className={`flex items-center space-x-2 space-x-reverse border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === "instapay"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedMethod("instapay")}
                >
                  <RadioGroupItem value="instapay" id="instapay" />
                  <Label
                    htmlFor="instapay"
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Wallet className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">إنستاباي</p>
                      <p className="text-xs text-muted-foreground">
                        تحويل فوري عبر إنستاباي مصر
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card className={selectedMethod ? "border-primary" : ""}>
          <CardHeader>
            <CardTitle>معلومات التحويل</CardTitle>
            <CardDescription>
              {selectedMethod
                ? "استخدم الرقم التالي لإتمام عملية الدفع"
                : "يرجى اختيار طريقة الدفع أولاً"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMethod ? (
              <div className="space-y-6">
                {/* Payment Number Card */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {selectedMethod === "vodafone" ? "رقم فودافون كاش" : "رقم إنستاباي"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-3xl font-bold font-mono tracking-wider">
                      {PAYMENT_NUMBER}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(PAYMENT_NUMBER)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      نسخ
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    خطوات الدفع:
                  </h4>
                  <ol className="space-y-3 mr-7">
                    <li className="text-sm">
                      <span className="font-medium">1.</span> افتح تطبيق{" "}
                      {selectedMethod === "vodafone" ? "فودافون كاش" : "إنستاباي"}
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">2.</span> اختر "تحويل" أو "إرسال أموال"
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">3.</span> أدخل الرقم: <span className="font-mono font-bold">{PAYMENT_NUMBER}</span>
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">4.</span> أدخل المبلغ المطلوب
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">5.</span> أكمل عملية التحويل
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">6.</span> احتفظ برقم العملية للمتابعة
                    </li>
                  </ol>
                </div>

                {/* Important Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <span className="font-semibold">ملاحظة هامة:</span> بعد إتمام التحويل، يرجى الاحتفاظ برقم العملية والتواصل معنا لتأكيد الدفع.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  اختر طريقة الدفع لعرض تفاصيل التحويل
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">الأمان والخصوصية</h4>
              <p className="text-sm text-muted-foreground">
                تأكد من التحويل فقط على الرقم المعروض أعلاه. لا تشارك معلومات الدفع الخاصة بك مع أي شخص آخر.
                في حالة وجود أي استفسار، يرجى التواصل مع خدمة العملاء.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
