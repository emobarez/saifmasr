
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Trash2, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { logActivity, ActivityActionType } from "@/lib/activityLogger";

interface Client {
  id: string;
  name: string;
  email: string;
  joinDate: Timestamp | Date; // Firestore timestamp or Date object
  status: "نشط" | "غير نشط" | "محظور";
}

const clientSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  status: z.enum(["نشط", "غير نشط", "محظور"], { required_error: "يرجى اختيار حالة العميل" }),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const q = query(collection(db, "clients"), orderBy("joinDate", "desc"));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة العملاء.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", status: "نشط" },
  });

  const editClientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  const handleAddClientSubmit = async (data: ClientFormValues) => {
    try {
      const docRef = await addDoc(collection(db, "clients"), {
        ...data,
        joinDate: serverTimestamp(),
      });
      toast({ title: "تم بنجاح", description: `تمت إضافة العميل ${data.name} بنجاح.` });
      
      if (adminUser) {
        await logActivity({
          actionType: "CLIENT_CREATED",
          description: `Admin ${adminUser.displayName || adminUser.email} added new client: ${data.name}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: docRef.id, type: "client", name: data.name },
        });
      }

      addClientForm.reset();
      setIsAddClientDialogOpen(false);
      fetchClients(); // Refresh list
    } catch (error) {
      console.error("Error adding client:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة العميل.", variant: "destructive" });
    }
  };

  const handleEditClientSubmit = async (data: ClientFormValues) => {
    if (!editingClient) return;
    try {
      const clientRef = doc(db, "clients", editingClient.id);
      await updateDoc(clientRef, {
        name: data.name,
        email: data.email,
        status: data.status,
      });
      toast({ title: "تم التعديل بنجاح", description: `تم تعديل بيانات العميل ${data.name}.` });
      
      if (adminUser) {
         await logActivity({
          actionType: "CLIENT_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated client: ${data.name}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: editingClient.id, type: "client", name: data.name },
        });
      }

      setIsEditClientDialogOpen(false);
      setEditingClient(null);
      fetchClients(); // Refresh list
    } catch (error) {
      console.error("Error updating client:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تعديل بيانات العميل.", variant: "destructive" });
    }
  };
  
  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    editClientForm.reset({
      name: client.name,
      email: client.email,
      status: client.status,
    });
    setIsEditClientDialogOpen(true);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف العميل ${clientName}؟`)) return;
    try {
      await deleteDoc(doc(db, "clients", clientId));
      toast({ title: "تم الحذف", description: `تم حذف العميل ${clientName} بنجاح.` });

      if (adminUser) {
        await logActivity({
          actionType: "CLIENT_DELETED",
          description: `Admin ${adminUser.displayName || adminUser.email} deleted client: ${clientName}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: clientId, type: "client", name: clientName },
        });
      }
      fetchClients(); // Refresh list
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف العميل.", variant: "destructive" });
    }
  };
  
  const getStatusVariant = (status: Client["status"]): "default" | "secondary" | "destructive" => {
    if (status === "نشط") return "default";
    if (status === "غير نشط") return "secondary";
    if (status === "محظور") return "destructive";
    return "default";
  };

  const formatDate = (dateValue: Timestamp | Date | undefined): string => {
    if (!dateValue) return "غير متوفر";
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate().toLocaleDateString('ar-EG');
    }
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('ar-EG');
    }
    return "تاريخ غير صالح";
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowercasedFilter = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowercasedFilter) ||
      client.email.toLowerCase().includes(lowercasedFilter)
    );
  }, [clients, searchTerm]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة العملاء</CardTitle>
            <CardDescription>عرض، تعديل، وإضافة عملاء جدد للنظام.</CardDescription>
          </div>
          <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <UserPlus className="me-2 h-5 w-5" />
                إضافة عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة عميل جديد</DialogTitle>
                <DialogDescription>
                  املأ النموذج أدناه لإضافة عميل جديد إلى النظام.
                </DialogDescription>
              </DialogHeader>
              <Form {...addClientForm}>
                <form onSubmit={addClientForm.handleSubmit(handleAddClientSubmit)} className="space-y-4 py-4">
                  <FormField control={addClientForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم العميل</FormLabel>
                        <FormControl><Input placeholder="مثال: أحمد محمد" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={addClientForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl><Input type="email" placeholder="example@mail.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={addClientForm.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>حالة العميل</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                          <FormControl><SelectTrigger><SelectValue placeholder="اختر حالة العميل" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="نشط">نشط</SelectItem>
                            <SelectItem value="غير نشط">غير نشط</SelectItem>
                            <SelectItem value="محظور">محظور</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddClientDialogOpen(false)} disabled={addClientForm.formState.isSubmitting}>إلغاء</Button>
                    <Button type="submit" disabled={addClientForm.formState.isSubmitting}>
                      {addClientForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      إضافة العميل
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
              placeholder="ابحث عن عميل (بالاسم أو البريد الإلكتروني)..." 
              className="ps-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {isLoadingClients ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل العملاء...</p></div>
          ) : filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">المعرف</TableHead>
                    <TableHead className="min-w-[150px]">الاسم</TableHead>
                    <TableHead className="min-w-[200px]">البريد الإلكتروني</TableHead>
                    <TableHead className="min-w-[120px]">تاريخ الانضمام</TableHead>
                    <TableHead className="min-w-[100px]">الحالة</TableHead>
                    <TableHead className="min-w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="text-xs sm:text-sm">
                      <TableCell className="font-medium truncate max-w-[100px]">{client.id}</TableCell>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{formatDate(client.joinDate)}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(client.status)}>{client.status}</Badge></TableCell>
                      <TableCell className="space-x-1 space-x-reverse">
                        <Button variant="ghost" size="icon" aria-label="تعديل العميل" onClick={() => openEditDialog(client)}>
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="حذف العميل" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClient(client.id, client.name)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-8">{searchTerm ? "لم يتم العثور على عملاء يطابقون بحثك." : "لا يوجد عملاء لعرضهم حالياً. قم بإضافة عميل جديد."}</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
            <DialogDescription>
              قم بتحديث بيانات العميل {editingClient?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editClientForm}>
            <form onSubmit={editClientForm.handleSubmit(handleEditClientSubmit)} className="space-y-4 py-4">
              <FormField control={editClientForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم العميل</FormLabel>
                    <FormControl><Input placeholder="مثال: أحمد محمد" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={editClientForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl><Input type="email" placeholder="example@mail.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={editClientForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>حالة العميل</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر حالة العميل" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="نشط">نشط</SelectItem>
                        <SelectItem value="غير نشط">غير نشط</SelectItem>
                        <SelectItem value="محظور">محظور</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditClientDialogOpen(false)} disabled={editClientForm.formState.isSubmitting}>إلغاء</Button>
                <Button type="submit" disabled={editClientForm.formState.isSubmitting}>
                  {editClientForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    

    