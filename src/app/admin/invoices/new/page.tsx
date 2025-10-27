"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, Minus, User } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { formatEGPSimple } from "@/lib/egyptian-utils";

interface User {
  id: string;
  name: string;
  email: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    clientId: "",
    invoiceNumber: "",
    description: "",
    dueDate: "",
    status: "PENDING",
    paymentMethod: "",
    taxRate: 14.0 // Egyptian VAT rate
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);

  // Load users
  useEffect(() => {
    loadUsers();
    generateInvoiceNumber();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const invoiceNumber = `INV-${timestamp}`;
    setFormData(prev => ({ ...prev, invoiceNumber }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate total price for this item
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * formData.taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.invoiceNumber.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال العميل ورقم الفاتورة",
        variant: "destructive"
      });
      return;
    }

    const validItems = items.filter(item => item.description.trim() && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إضافة عنصر واحد على الأقل للفاتورة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const total = calculateTotal();

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          invoiceNumber: formData.invoiceNumber.trim(),
          description: formData.description.trim() || null,
          amount: subtotal,
          taxAmount,
          totalAmount: total,
          dueDate: formData.dueDate || null,
          status: formData.status,
          paymentMethod: formData.paymentMethod || null,
          items: validItems
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل في إنشاء الفاتورة");
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الفاتورة الجديدة بنجاح"
      });

      router.push("/admin/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="outline" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
          <Link href="/admin/invoices">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">إنشاء فاتورة جديدة</h1>
          <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">إنشاء فاتورة جديدة لأحد العملاء</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات الفاتورة</CardTitle>
            <CardDescription>معلومات أساسية عن الفاتورة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-sm sm:text-base">العميل *</Label>
                <Select value={formData.clientId} onValueChange={(value) => handleInputChange("clientId", value)}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder={loadingUsers ? "جاري التحميل..." : "اختر العميل"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <User className="h-4 w-4" />
                          <span>{user.name} ({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Number */}
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">رقم الفاتورة *</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                  placeholder="INV-123456"
                  required
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">حالة الفاتورة</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">في الانتظار</SelectItem>
                    <SelectItem value="PAID">مدفوعة</SelectItem>
                    <SelectItem value="OVERDUE">متأخرة</SelectItem>
                    <SelectItem value="CANCELLED">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف الفاتورة</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="وصف إجمالي للخدمات المقدمة..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>بنود الفاتورة</CardTitle>
            <CardDescription>أضف البنود والخدمات المدرجة في الفاتورة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-12 md:col-span-5 space-y-2">
                  <Label>الوصف</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    placeholder="وصف الخدمة أو المنتج"
                  />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-2">
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-2">
                  <Label>السعر</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3 md:col-span-2 space-y-2">
                  <Label>المجموع</Label>
                  <div className="h-10 flex items-center text-sm font-medium">
                    {formatEGPSimple(item.totalPrice)}
                  </div>
                </div>
                <div className="col-span-1 space-y-2">
                  <Label className="invisible">حذف</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              إضافة بند جديد
            </Button>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>ملخص الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>{formatEGPSimple(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span>ضريبة القيمة المضافة ({formData.taxRate}%):</span>
                <span>{formatEGPSimple(calculateTax())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>المجموع الإجمالي:</span>
                <span>{formatEGPSimple(calculateTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/invoices">
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={loading || loadingUsers}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            إنشاء الفاتورة
          </Button>
        </div>
      </form>
    </div>
  );
}