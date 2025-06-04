
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash2, Loader2, Users as UsersIcon } from "lucide-react";
// Dialog components will be needed later for Add/Edit
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// Form components will be needed later
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// Select will be needed later
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, query, orderBy, deleteDoc, doc } from "firebase/firestore"; // serverTimestamp, addDoc, updateDoc will be needed later

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

// Zod schema for employee form validation (will be used later)
/*
const employeeSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  employeeId: z.string().min(1, { message: "الرقم الوظيفي مطلوب" }),
  jobTitle: z.string().min(2, { message: "المسمى الوظيفي مطلوب" }),
  department: z.string().min(2, { message: "القسم مطلوب" }),
  joinDate: z.date({ required_error: "تاريخ الانضمام مطلوب" }),
  status: z.enum(["نشط", "غير نشط", "في إجازة"], { required_error: "يرجى اختيار حالة الموظف" }),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, { message: "رقم الهاتف المصري غير صالح" }), // Basic Egyptian phone validation
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  nationalId: z.string().optional(),
  address: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;
*/

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
      const q = query(collection(db, "employees"), orderBy("name", "asc")); // Or orderBy joinDate or createdAt
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

  // Add/Edit form instances (will be used later)
  /*
  const addEmployeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    // Default values here
  });

  const editEmployeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });
  */

  // Handle Add/Edit/Delete submissions (will be implemented later)
  const handleAddEmployeeSubmit = async (data: any /* EmployeeFormValues */) => {
    // Implementation later
    console.log("Add employee:", data);
  };

  const handleEditEmployeeSubmit = async (data: any /* EmployeeFormValues */) => {
    // Implementation later
    console.log("Edit employee:", data);
  };
  
  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    // editEmployeeForm.reset({...}); // Reset form with employee data - later
    setIsEditEmployeeDialogOpen(true);
    toast({title: "ملاحظة", description: "وظيفة تعديل الموظف سيتم تفعيلها قريباً."});
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!window.confirm(\`هل أنت متأكد أنك تريد حذف الموظف \${employeeName}؟\nهذا الإجراء لا يمكن التراجع عنه.\`)) return;
    try {
      await deleteDoc(doc(db, "employees", employeeId));
      toast({ title: "تم الحذف", description: \`تم حذف الموظف \${employeeName} بنجاح.\` });
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الموظف.", variant: "destructive" });
    }
  };
  
  const getStatusVariant = (status: Employee["status"]): "default" | "secondary" | "destructive" => {
    if (status === "نشط") return "default";
    if (status === "غير نشط") return "secondary";
    if (status === "في إجازة") return "destructive"; // Or another color like warning/yellow
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
          {/* DialogTrigger for Add Employee will be here */}
          <Button className="mt-4 md:mt-0" onClick={() => { setIsAddEmployeeDialogOpen(true); toast({title: "ملاحظة", description: "وظيفة إضافة موظف جديد سيتم تفعيلها قريباً."})}}>
            <PlusCircle className="me-2 h-5 w-5" />
            إضافة موظف جديد
          </Button>
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

      {/* Add Employee Dialog (Structure to be filled later) */}
      {/* 
      <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>
              املأ النموذج أدناه لإضافة موظف جديد.
            </DialogDescription>
          </DialogHeader>
          <Form {...addEmployeeForm}>
            <form onSubmit={addEmployeeForm.handleSubmit(handleAddEmployeeSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              // FormFields will go here
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
      */}

      {/* Edit Employee Dialog (Structure to be filled later) */}
      {/* 
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
                // FormFields will go here, pre-filled with editingEmployee data
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
      */}
    </div>
  );
}
