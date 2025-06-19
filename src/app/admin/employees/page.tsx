
"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Search, Edit, Trash2, Loader2, Users as UsersIcon, CalendarIcon, UserSquare2, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDateFn } from "date-fns";
import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase"; 
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"; 
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";

const MAX_FILE_SIZE_EMPLOYEE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES_EMPLOYEE = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export interface Employee {
  id: string;
  name: string;
  employeeId: string; 
  jobTitle: string; 
  department: string; 
  joinDate: Timestamp | Date; 
  status: "نشط" | "غير نشط" | "في إجازة"; 
  phone: string;
  email: string;
  nationalId?: string;
  address?: string;
  profileImageUrl?: string;
  createdAt?: Timestamp; 
}

const employeeSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  employeeId: z.string().min(1, { message: "الرقم الوظيفي مطلوب" }),
  jobTitle: z.string().min(2, { message: "المسمى الوظيفي مطلوب" }),
  department: z.string().min(2, { message: "القسم مطلوب" }),
  joinDate: z.date({ required_error: "تاريخ الانضمام مطلوب" }),
  status: z.enum(["نشط", "غير نشط", "في إجازة"], { required_error: "يرجى اختيار حالة الموظف" }),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, { message: "رقم الهاتف المصري غير صالح (مثال: 01012345678)" }), 
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  nationalId: z.string().optional().refine(val => !val || /^[0-9]{14}$/.test(val), { message: "الرقم القومي يجب أن يكون 14 رقمًا (إن وجد)"}),
  address: z.string().max(200, {message: "العنوان يجب ألا يتجاوز 200 حرف"}).optional(),
  profileImageUrl: z.string().url({message: "رابط صورة الملف الشخصي غير صالح"}).optional().or(z.literal('')),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const getInitials = (name: string) => {
  if (!name) return "SM"; 
  const nameParts = name.split(" ");
  if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
  return (nameParts[0][0] + (nameParts[nameParts.length - 1][0] || '')).toUpperCase();
};


export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const addFormProfileImageInputRef = useRef<HTMLInputElement>(null);
  const editFormProfileImageInputRef = useRef<HTMLInputElement>(null);


  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const q = query(collection(db, "employees"), orderBy("createdAt", "desc")); 
      const querySnapshot = await getDocs(q);
      const employeesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة الموظفين.", variant: "destructive" });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  
  const addEmployeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "", employeeId: "", jobTitle: "", department: "", joinDate: new Date(), status: "نشط",
      phone: "", email: "", nationalId: "", address: "", profileImageUrl: "",
    },
  });

  const editEmployeeForm = useForm<EmployeeFormValues>({ 
    resolver: zodResolver(employeeSchema),
  });
  
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>, formInstance: typeof addEmployeeForm | typeof editEmployeeForm) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_EMPLOYEE) {
        toast({ title: "خطأ في الملف", description: `حجم الصورة يجب أن لا يتجاوز ${MAX_FILE_SIZE_EMPLOYEE / 1024 / 1024} ميجا بايت.`, variant: "destructive" });
        setSelectedImageFile(null);
        setImagePreviewUrl(editingEmployee?.profileImageUrl || null);
        if (event.target) event.target.value = "";
        formInstance.setValue("profileImageUrl", editingEmployee?.profileImageUrl || "");
        return;
      }
      if (!ALLOWED_IMAGE_TYPES_EMPLOYEE.includes(file.type)) {
        toast({ title: "خطأ في الملف", description: "نوع الصورة غير مدعوم. الأنواع المسموح بها: JPG, PNG, GIF, WEBP.", variant: "destructive" });
        setSelectedImageFile(null);
        setImagePreviewUrl(editingEmployee?.profileImageUrl || null);
        if (event.target) event.target.value = "";
        formInstance.setValue("profileImageUrl", editingEmployee?.profileImageUrl || "");
        return;
      }
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      formInstance.setValue("profileImageUrl", "", { shouldValidate: false }); // Clear text URL if file is chosen
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(editingEmployee?.profileImageUrl || null);
      // Don't reset formInstance.profileImageUrl here, user might want to keep existing URL if they cancel file selection
    }
  };

  const uploadProfileImage = async (file: File, employeeId: string): Promise<string> => {
    if (!storage) {
      toast({ title: "خطأ في الخدمة", description: "خدمة تخزين الملفات غير متاحة حالياً. لا يمكن رفع الصورة.", variant: "destructive" });
      throw new Error("Firebase Storage is not initialized.");
    }
    setIsUploadingImage(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const imagePath = `employee-profile-pictures/${employeeId}/profile.${fileExtension}`;
      const storageRef = ref(storage, imagePath);
      
      toast({ title: "جارٍ رفع الصورة...", description: "قد يستغرق هذا بعض الوقت."});
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', 
          null, 
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } finally {
      setIsUploadingImage(false);
    }
  };


  const handleAddEmployeeSubmit = async (data: EmployeeFormValues) => {
    let finalProfileImageUrl: string | null = null;
    let docRefId: string | null = null;

    try {
      if (selectedImageFile && !storage) {
        toast({ title: "خطأ في الخدمة", description: "خدمة تخزين الملفات غير متاحة حالياً. لا يمكن رفع الصورة.", variant: "destructive" });
        return;
      }

      const employeeDocData: Omit<Employee, 'id' | 'profileImageUrl' | 'createdAt'> & { joinDate: Timestamp, createdAt: Timestamp, profileImageUrl?: string } = {
        ...data,
        nationalId: data.nationalId || undefined,
        address: data.address || undefined,
        joinDate: Timestamp.fromDate(data.joinDate),
        createdAt: serverTimestamp() as Timestamp,
      };

      if (selectedImageFile) {
        // Image will be uploaded and URL set after doc creation
      } else if (data.profileImageUrl && data.profileImageUrl.trim() !== "") {
        employeeDocData.profileImageUrl = data.profileImageUrl;
        finalProfileImageUrl = data.profileImageUrl;
      }


      const docRef = await addDoc(collection(db, "employees"), employeeDocData);
      docRefId = docRef.id;

      if (selectedImageFile) {
        finalProfileImageUrl = await uploadProfileImage(selectedImageFile, docRef.id);
        await updateDoc(doc(db, "employees", docRef.id), { profileImageUrl: finalProfileImageUrl });
      }
      
      toast({ title: "تم بنجاح", description: `تمت إضافة الموظف ${data.name} بنجاح.` });

      if (adminUser && docRefId) {
        await logActivity({
          actionType: "EMPLOYEE_CREATED",
          description: `Admin ${adminUser.displayName || adminUser.email} added new employee: ${data.name}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: docRefId, type: "employee", name: data.name },
          details: { employeeId: data.employeeId, jobTitle: data.jobTitle, hasProfileImage: !!finalProfileImageUrl }
        });
        if (finalProfileImageUrl) { // Log if an image was set, either by upload or URL
            await logActivity({
                actionType: "EMPLOYEE_PROFILE_PICTURE_UPDATED",
                description: `Admin ${adminUser.displayName || adminUser.email} set profile picture for new employee: ${data.name}.`,
                actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
                target: { id: docRefId, type: "employee", name: data.name },
                details: { newImageUrl: finalProfileImageUrl }
            });
        }
      }

      addEmployeeForm.reset();
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      if(addFormProfileImageInputRef.current) addFormProfileImageInputRef.current.value = "";
      setIsAddEmployeeDialogOpen(false);
      fetchEmployees(); 
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الموظف.", variant: "destructive" });
      setIsUploadingImage(false); 
    }
  };

  const handleEditEmployeeSubmit = async (data: EmployeeFormValues) => {
    if (!editingEmployee) return;
    let finalProfileImageUrl: string | null = null;
    const oldImageUrl = editingEmployee.profileImageUrl;

    try {
      if (selectedImageFile && !storage) {
        toast({ title: "خطأ في الخدمة", description: "خدمة تخزين الملفات غير متاحة حالياً. لا يمكن رفع الصورة.", variant: "destructive" });
        return;
      }

      if (selectedImageFile) {
        finalProfileImageUrl = await uploadProfileImage(selectedImageFile, editingEmployee.id);
      } else if (data.profileImageUrl === '') { // Explicit removal via empty text field or "Remove" button
          finalProfileImageUrl = null; 
      } else { // Use URL from text input if present, otherwise keep existing (or it remains null if it was null)
          finalProfileImageUrl = data.profileImageUrl || oldImageUrl || null;
      }

      const employeeRef = doc(db, "employees", editingEmployee.id);
      // Ensure employeeId is not overwritten from form data during edit.
      // It should be read from editingEmployee.employeeId
      const { employeeId, ...dataToUpdate } = data;

      await updateDoc(employeeRef, {
        ...dataToUpdate, // name, jobTitle, department, status, phone, email etc.
        nationalId: data.nationalId || undefined,
        address: data.address || undefined,
        profileImageUrl: finalProfileImageUrl,
        joinDate: Timestamp.fromDate(data.joinDate),
        employeeId: editingEmployee.employeeId, // Explicitly use the existing employeeId
      });
      toast({ title: "تم التعديل بنجاح", description: `تم تعديل بيانات الموظف ${data.name}.` });

      if (adminUser) {
        await logActivity({
          actionType: "EMPLOYEE_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated employee: ${data.name}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: editingEmployee.id, type: "employee", name: data.name },
          details: { employeeId: editingEmployee.employeeId, jobTitle: data.jobTitle }
        });
         if (oldImageUrl !== finalProfileImageUrl) { 
            await logActivity({
                actionType: "EMPLOYEE_PROFILE_PICTURE_UPDATED",
                description: `Admin ${adminUser.displayName || adminUser.email} ${finalProfileImageUrl ? 'updated' : 'removed'} profile picture for employee: ${data.name}.`,
                actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
                target: { id: editingEmployee.id, type: "employee", name: data.name },
                details: { oldImageUrl: oldImageUrl || "none", newImageUrl: finalProfileImageUrl || "none" }
            });
        }
      }

      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      if(editFormProfileImageInputRef.current) editFormProfileImageInputRef.current.value = "";
      setIsEditEmployeeDialogOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تعديل بيانات الموظف.", variant: "destructive" });
      setIsUploadingImage(false);
    }
  };
  
  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setSelectedImageFile(null);
    setImagePreviewUrl(employee.profileImageUrl || null);
    if(editFormProfileImageInputRef.current) editFormProfileImageInputRef.current.value = "";
    editEmployeeForm.reset({
      ...employee,
      joinDate: employee.joinDate instanceof Timestamp ? employee.joinDate.toDate() : new Date(employee.joinDate),
      nationalId: employee.nationalId || "",
      address: employee.address || "",
      profileImageUrl: employee.profileImageUrl || "",
    });
    setIsEditEmployeeDialogOpen(true);
  };
  
  const openAddDialog = () => {
    addEmployeeForm.reset({ name: "", employeeId: "", jobTitle: "", department: "", joinDate: new Date(), status: "نشط", phone: "", email: "", nationalId: "", address: "", profileImageUrl: "" });
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if(addFormProfileImageInputRef.current) addFormProfileImageInputRef.current.value = "";
    setIsAddEmployeeDialogOpen(true);
  }


  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف الموظف ${employeeName}؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
      const employeeToDelete = employees.find(emp => emp.id === employeeId);
      if (employeeToDelete?.profileImageUrl) {
        if (!storage) {
            toast({ title: "تحذير", description: "خدمة تخزين الملفات غير متاحة حالياً. لا يمكن حذف الصورة من المخزن. سيتم حذف بيانات الموظف فقط.", variant: "destructive", duration: 7000 });
        } else {
            try {
                const imageHttpUrl = employeeToDelete.profileImageUrl;
                if (imageHttpUrl.startsWith("https://firebasestorage.googleapis.com/") || imageHttpUrl.startsWith("https://storage.googleapis.com/")) { // Check both common Firebase Storage URL formats
                    // Attempt to parse path from URL, robustly handling different Firebase Storage URL structures
                    let imageStoragePath = "";
                    try {
                        const url = new URL(imageHttpUrl);
                        // For 'firebasestorage.googleapis.com', path is usually after /o/ and before ?alt=media
                        // For 'storage.googleapis.com', path is usually after the bucket name.
                        if (url.hostname === "firebasestorage.googleapis.com") {
                            imageStoragePath = decodeURIComponent(url.pathname.substring(url.pathname.indexOf('/o/') + 3).split('?')[0]);
                        } else if (url.hostname === "storage.googleapis.com") {
                            // Assumes path starts after the first segment (bucket name)
                            imageStoragePath = decodeURIComponent(url.pathname.substring(url.pathname.indexOf('/', 1) + 1).split('?')[0]);
                        }
                    } catch (urlParseError) {
                        console.warn("Could not parse storage path from URL:", imageHttpUrl, urlParseError);
                    }

                    if (imageStoragePath) {
                        const imageRefToDelete = ref(storage, imageStoragePath);
                        await deleteObject(imageRefToDelete);
                        toast({ title: "تم حذف الصورة", description: "تم حذف صورة الملف الشخصي للموظف من المخزن.", variant: "default" });
                    } else {
                         console.warn("Could not determine storage path for deletion from URL:", imageHttpUrl);
                         toast({ title: "تنبيه", description: "تعذر تحديد مسار الصورة في المخزن. سيتم حذف بيانات الموظف فقط.", variant: "destructive", duration: 7000 });
                    }
                }
            } catch (storageError) {
                console.error("Error deleting profile image from storage, continuing with Firestore delete:", storageError);
                toast({ title: "تنبيه", description: "تم حذف بيانات الموظف، ولكن حدث خطأ أثناء محاولة حذف الصورة من المخزن. قد تحتاج لمراجعة المخزن يدوياً.", variant: "destructive", duration: 7000 });
            }
          }
      }
      
      await deleteDoc(doc(db, "employees", employeeId));
      toast({ title: "تم الحذف", description: `تم حذف الموظف ${employeeName} بنجاح.` });

      if (adminUser) {
        await logActivity({
          actionType: "EMPLOYEE_DELETED",
          description: `Admin ${adminUser.displayName || adminUser.email} deleted employee: ${employeeName}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: employeeId, type: "employee", name: employeeName },
        });
      }
      fetchEmployees(); 
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الموظف.", variant: "destructive" });
    }
  };
  
  const getStatusVariant = (status: Employee["status"]): "default" | "secondary" | "destructive" => {
    if (status === "نشط") return "default";
    if (status === "غير نشط") return "secondary";
    if (status === "في إجازة") return "secondary"; 
    return "default";
  };

  const formatDate = (dateValue: Timestamp | Date | undefined): string => {
    if (!dateValue) return "غير متوفر";
    let date: Date;
    if (dateValue instanceof Timestamp) { date = dateValue.toDate(); } 
    else if (dateValue instanceof Date) { date = dateValue; } 
    else { return "تاريخ غير صالح"; }
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const lowercasedFilter = searchTerm.toLowerCase();
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(lowercasedFilter) ||
      employee.employeeId.toLowerCase().includes(lowercasedFilter) ||
      employee.jobTitle.toLowerCase().includes(lowercasedFilter) ||
      employee.department.toLowerCase().includes(lowercasedFilter) ||
      employee.email.toLowerCase().includes(lowercasedFilter) ||
      employee.phone.includes(searchTerm) 
    );
  }, [employees, searchTerm]);


  const renderEmployeeFormFields = (formInstance: typeof addEmployeeForm | typeof editEmployeeForm, isEditing = false) => {
    const currentProfileImageInputRef = isEditing ? editFormProfileImageInputRef : addFormProfileImageInputRef;
    
    return (
    <>
        <div className="mb-4 flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-2">
            <AvatarImage src={imagePreviewUrl || (isEditing ? editingEmployee?.profileImageUrl : null) || undefined} alt="الصورة الشخصية للموظف" />
            <AvatarFallback><UserSquare2 className="h-12 w-12 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <Input 
            id={isEditing ? "editProfileImageUpload" : "addProfileImageUpload"}
            ref={currentProfileImageInputRef}
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageFileChange(e, formInstance)}
            className="text-xs max-w-xs"
            disabled={isUploadingImage || formInstance.formState.isSubmitting}
          />
           {isEditing && (imagePreviewUrl || (editingEmployee?.profileImageUrl && !selectedImageFile)) && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-1 text-xs text-destructive hover:text-destructive/80 p-0 h-auto"
              onClick={() => {
                setImagePreviewUrl(null);
                setSelectedImageFile(null);
                formInstance.setValue("profileImageUrl", "", { shouldValidate: true });
                if (currentProfileImageInputRef.current) {
                  currentProfileImageInputRef.current.value = "";
                }
              }}
              disabled={isUploadingImage || formInstance.formState.isSubmitting}
            >
              <Trash2 className="me-1 h-3 w-3" />
              إزالة الصورة الحالية
            </Button>
          )}
          <FormMessage>{formInstance.formState.errors.profileImageUrl?.message /* For potential zod errors on the string field if URL is manually entered badly */}</FormMessage>
        </div>
       <FormField control={formInstance.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>اسم الموظف</FormLabel><FormControl><Input placeholder="الاسم بالكامل" {...field} disabled={isUploadingImage} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="employeeId" render={({ field }) => (
          <FormItem>
            <FormLabel>الرقم الوظيفي</FormLabel>
            <FormControl>
              <Input 
                placeholder="مثال: EMP001" 
                {...field} 
                disabled={isUploadingImage || (isEditing && !!editingEmployee?.employeeId)} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={formInstance.control} name="jobTitle" render={({ field }) => (
          <FormItem><FormLabel>المسمى الوظيفي</FormLabel><FormControl><Input placeholder="مثال: فرد أمن" {...field} disabled={isUploadingImage} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="department" render={({ field }) => (
          <FormItem><FormLabel>القسم</FormLabel><FormControl><Input placeholder="مثال: عمليات الموقع" {...field} disabled={isUploadingImage} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="joinDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الانضمام</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isUploadingImage}>
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {field.value ? formatDateFn(field.value, "PPP", { locale: arSA }) : <span>اختر تاريخ</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus captionLayout="dropdown-buttons" fromYear={1990} toYear={new Date().getFullYear() + 5}/>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}/>
        <FormField control={formInstance.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>حالة الموظف</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={isUploadingImage}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر حالة الموظف" /></SelectTrigger></FormControl>
                <SelectContent>
                    <SelectItem value="نشط">نشط</SelectItem>
                    <SelectItem value="غير نشط">غير نشط</SelectItem>
                    <SelectItem value="في إجازة">في إجازة</SelectItem>
                </SelectContent>
            </Select><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input type="tel" placeholder="01xxxxxxxxx" {...field} disabled={isUploadingImage} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" placeholder="employee@example.com" {...field} disabled={isUploadingImage} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="nationalId" render={({ field }) => (
            <FormItem><FormLabel>الرقم القومي (اختياري)</FormLabel><FormControl><Input placeholder="14 رقمًا" {...field} disabled={isUploadingImage} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="address" render={({ field }) => (
            <FormItem><FormLabel>العنوان (اختياري)</FormLabel><FormControl><Textarea placeholder="عنوان إقامة الموظف" {...field} rows={2} disabled={isUploadingImage}/></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="profileImageUrl" render={({ field }) => (
            <FormItem>
                <FormLabel className="flex items-center gap-1"><Camera className="h-4 w-4 text-muted-foreground" />رابط صورة الملف الشخصي (أو ارفع أعلاه)</FormLabel>
                <FormControl><Input placeholder="https://example.com/image.png" {...field} value={field.value || ""} disabled={isUploadingImage || !!selectedImageFile} /></FormControl>
                <FormMessage />
            </FormItem>
        )}/>
    </>
    )
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-2">
                <UsersIcon className="h-7 w-7 text-primary" />
                <CardTitle className="font-headline text-xl text-primary">إدارة الموظفين وأفراد الأمن</CardTitle>
            </div>
            <CardDescription>عرض، تعديل، وإضافة موظفين جدد للنظام.</CardDescription>
          </div>
          <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
            <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0" onClick={openAddDialog}>
                    <PlusCircle className="me-2 h-5 w-5" />
                    إضافة موظف جديد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
                <DialogDescription>
                  املأ النموذج أدناه لإضافة موظف جديد.
                </DialogDescription>
              </DialogHeader>
              <Form {...addEmployeeForm}>
                <form onSubmit={addEmployeeForm.handleSubmit(handleAddEmployeeSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                  {renderEmployeeFormFields(addEmployeeForm)}
                  <DialogFooter className="pt-4 sticky bottom-0 bg-card pb-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)} disabled={addEmployeeForm.formState.isSubmitting || isUploadingImage}>إلغاء</Button>
                    <Button type="submit" disabled={addEmployeeForm.formState.isSubmitting || isUploadingImage}>
                      {(addEmployeeForm.formState.isSubmitting || isUploadingImage) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      {isUploadingImage ? "جارٍ رفع الصورة..." : addEmployeeForm.formState.isSubmitting ? "جارٍ الحفظ..." : "إضافة الموظف"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative max-w-sm">
            <Input 
              placeholder="ابحث (الاسم، الرقم الوظيفي، الإيميل...)" 
              className="ps-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {isLoadingEmployees ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل قائمة الموظفين...</p></div>
          ) : filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">الصورة</TableHead>
                    <TableHead className="min-w-[120px]">الرقم الوظيفي</TableHead>
                    <TableHead className="min-w-[150px]">الاسم</TableHead>
                    <TableHead className="min-w-[150px]">المسمى الوظيفي</TableHead>
                    <TableHead className="min-w-[120px]">القسم</TableHead>
                    <TableHead className="min-w-[120px]">تاريخ الانضمام</TableHead>
                    <TableHead className="min-w-[100px]">الحالة</TableHead>
                    <TableHead className="min-w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} className="text-xs sm:text-sm">
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.profileImageUrl || undefined} alt={employee.name} />
                          <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.jobTitle}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{formatDate(employee.joinDate)}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(employee.status)}>{employee.status}</Badge></TableCell>
                      <TableCell className="space-x-1 space-x-reverse">
                        <Button variant="ghost" size="icon" aria-label="تعديل الموظف" onClick={() => openEditDialog(employee)}>
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="حذف الموظف" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEmployee(employee.id, employee.name)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-8">{searchTerm ? "لم يتم العثور على موظفين يطابقون بحثك." : "لا يوجد موظفون لعرضهم حالياً. قم بإضافة موظف جديد."}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditEmployeeDialogOpen} onOpenChange={setIsEditEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            <DialogDescription>
              قم بتحديث بيانات الموظف {editingEmployee?.name}.
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <Form {...editEmployeeForm}>
              <form onSubmit={editEmployeeForm.handleSubmit(handleEditEmployeeSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                {renderEmployeeFormFields(editEmployeeForm, true)}
                <DialogFooter className="pt-4 sticky bottom-0 bg-card pb-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditEmployeeDialogOpen(false)} disabled={editEmployeeForm.formState.isSubmitting || isUploadingImage}>إلغاء</Button>
                  <Button type="submit" disabled={editEmployeeForm.formState.isSubmitting || isUploadingImage}>
                     {(editEmployeeForm.formState.isSubmitting || isUploadingImage) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                     {isUploadingImage ? "جارٍ رفع الصورة..." : editEmployeeForm.formState.isSubmitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
    
