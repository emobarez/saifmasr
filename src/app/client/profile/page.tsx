
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  // TODO: Populate with actual user data and form handling
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");

  const getInitials = (name?: string | null) => {
    if (!name) return "CM"; // Client Mock
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleEditToggle = () => setIsEditing(!isEditing);
  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving profile:", { name, email });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl text-primary">الملف الشخصي</CardTitle>
            <CardDescription>إدارة معلومات حسابك وتفضيلاتك.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleEditToggle} aria-label={isEditing ? "إلغاء التعديل" : "تعديل الملف الشخصي"}>
            {isEditing ? <Save className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.displayName || undefined} alt={user?.displayName || "User"} />
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user?.displayName || "اسم المستخدم"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <form className="space-y-4">
            <div>
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} />
            </div>
            {isEditing && (
              <div>
                <Label htmlFor="currentPassword">كلمة المرور الحالية (لتغيير كلمة المرور)</Label>
                <Input id="currentPassword" type="password" placeholder="اتركها فارغة لعدم التغيير" />
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input id="newPassword" type="password" />
                <Label htmlFor="confirmNewPassword">تأكيد كلمة المرور الجديدة</Label>
                <Input id="confirmNewPassword" type="password" />
              </div>
            )}
            {isEditing && (
              <Button onClick={handleSave} className="w-full md:w-auto">
                <Save className="me-2 h-5 w-5" />
                حفظ التغييرات
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
