
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash2, Loader2, Users as UsersIcon, CalendarIcon } from "lucide-react";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

// Interface for Employee data
export interface Employee {
  id: string;
  name: string;
  employeeId: string; // الرقم الوظيفي
  jobTitle: string; // المسمى الوظيفي
  department: string; // القسم
  joinDate: Timestamp | Date; // تاريخ الانضمام
  status: "نشط" | "غير نشط" | "في إجازة"; // الحالة
  phone: string;
  email: string;
  nationalId?: string;
  address?: string;
  profileImageUrl?: string;
  createdAt?: Timestamp; // For sorting or tracking
}

// Zod schema for employee form validation
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


export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

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
      name: "",
      employeeId: "",
      jobTitle: "",
      department: "",
      joinDate: new Date(),
      status: "نشط",
      phone: "",
      email: "",
      nationalId: "",
      address: "",
      profileImageUrl: "",
    },
  });

  const editEmployeeForm = useForm<EmployeeFormValues>({ 
    resolver: zodResolver(employeeSchema),
  });
  

  const handleAddEmployeeSubmit = async (data: EmployeeFormValues) => {
    try {
      await addDoc(collection(db, "employees"), {
        ...data,
        joinDate: Timestamp.fromDate(data.joinDate),
        createdAt: serverTimestamp(),
      });
      toast({ title: "تم بنجاح", description: `تمت إضافة الموظف ${data.name} بنجاح.` });
      addEmployeeForm.reset();
      setIsAddEmployeeDialogOpen(false);
      fetchEmployees(); 
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الموظف.", variant: "destructive" });
    }
  };

  const handleEditEmployeeSubmit = async (data: EmployeeFormValues) => {
    if (!editingEmployee) return;
    try {
      const employeeRef = doc(db, "employees", editingEmployee.id);
      await updateDoc(employeeRef, {
        ...data,
        joinDate: Timestamp.fromDate(data.joinDate),
      });
      toast({ title: "تم التعديل بنجاح", description: `تم تعديل بيانات الموظف ${data.name}.` });
      setIsEditEmployeeDialogOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تعديل بيانات الموظف.", variant: "destructive" });
    }
  };
  
  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    editEmployeeForm.reset({
      ...employee,
      joinDate: employee.joinDate instanceof Timestamp ? employee.joinDate.toDate() : employee.joinDate,
    });
    setIsEditEmployeeDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف الموظف ${employeeName}؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
      await deleteDoc(doc(db, "employees", employeeId));
      toast({ title: "تم الحذف", description: `تم حذف الموظف ${employeeName} بنجاح.` });
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الموظف.", variant: "destructive" });
    }
  };
  
  const getStatusVariant = (status: Employee["status"]): "default" | "secondary" | "destructive" => {
    if (status === "نشط") return "default";
    if (status === "غير نشط") return "secondary";
    if (status === "في إجازة") return "destructive"; 
    return "default";
  };

  const formatDate = (dateValue: Timestamp | Date | undefined): string => {
    if (!dateValue) return "غير متوفر";
    let date: Date;
    if (dateValue instanceof Timestamp) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return "تاريخ غير صالح";
    }
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);


  const renderEmployeeFormFields = (formInstance: typeof addEmployeeForm | typeof editEmployeeForm) => (
    <>
       <FormField control={formInstance.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>اسم الموظف</FormLabel><FormControl><Input placeholder="الاسم بالكامل" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="employeeId" render={({ field }) => (
          <FormItem><FormLabel>الرقم الوظيفي</FormLabel><FormControl><Input placeholder="مثال: EMP001" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="jobTitle" render={({ field }) => (
          <FormItem><FormLabel>المسمى الوظيفي</FormLabel><FormControl><Input placeholder="مثال: فرد أمن" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="department" render={({ field }) => (
          <FormItem><FormLabel>القسم</FormLabel><FormControl><Input placeholder="مثال: عمليات الموقع" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="joinDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الانضمام</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
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
            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                <FormControl><SelectTrigger><SelectValue placeholder="اختر حالة الموظف" /></SelectTrigger></FormControl>
                <SelectContent>
                    <SelectItem value="نشط">نشط</SelectItem>
                    <SelectItem value="غير نشط">غير نشط</SelectItem>
                    <SelectItem value="في إجازة">في إجازة</SelectItem>
                </SelectContent>
            </Select><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input type="tel" placeholder="01xxxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" placeholder="employee@example.com" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="nationalId" render={({ field }) => (
            <FormItem><FormLabel>الرقم القومي (اختياري)</FormLabel><FormControl><Input placeholder="14 رقمًا" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="address" render={({ field }) => (
            <FormItem><FormLabel>العنوان (اختياري)</FormLabel><FormControl><Textarea placeholder="عنوان إقامة الموظف" {...field} rows={2} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={formInstance.control} name="profileImageUrl" render={({ field }) => (
            <FormItem><FormLabel>رابط صورة الملف الشخصي (اختياري)</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
    </>
  );


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
                <Button className="mt-4 md:mt-0" onClick={() => addEmployeeForm.reset()}>
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
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)} disabled={addEmployeeForm.formState.isSubmitting}>إلغاء</Button>
                    <Button type="submit" disabled={addEmployeeForm.formState.isSubmitting}>
                      {addEmployeeForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      إضافة الموظف
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
              placeholder="ابحث (بالاسم, الرقم الوظيفي, المسمى, القسم)..." 
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
                    <TableRow key={employee.id}>
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
                {renderEmployeeFormFields(editEmployeeForm)}
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditEmployeeDialogOpen(false)} disabled={editEmployeeForm.formState.isSubmitting}>إلغاء</Button>
                  <Button type="submit" disabled={editEmployeeForm.formState.isSubmitting}>
                    {editEmployeeForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    حفظ التعديلات
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
    

    