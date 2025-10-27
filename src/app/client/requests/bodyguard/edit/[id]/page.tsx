"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Send, Undo2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const MapPicker = dynamic(() => import('@/components/client/MapPicker').then(m => m.MapPicker), { ssr: false });

export default function EditBodyguardDraftPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/service-requests/${id}`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (!json.isDraft) {
          toast({ title: 'هذا الطلب ليس مسودة', variant: 'destructive' });
          router.replace('/client/tracking');
          return;
        }
        setData(json);
        setAttachments(json.attachments || []);
      } catch (e: any) {
        toast({ title: 'تعذر تحميل الطلب', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, toast, router]);

  const updateField = (field: string, value: any) => setData((prev: any) => ({ ...prev, [field]: value }));

  const save = async (submit: boolean) => {
    try {
      setSaving(true);
      const payload = {
        title: data.title,
        description: data.description,
        personnelCount: data.personnelCount ? Number(data.personnelCount) : null,
        durationUnit: data.durationUnit,
        startAt: data.startAt ? new Date(data.startAt).toISOString() : null,
        endAt: data.endAt ? new Date(data.endAt).toISOString() : null,
        locationText: data.locationText,
        locationLat: data.locationLat === '' ? null : Number(data.locationLat),
        locationLng: data.locationLng === '' ? null : Number(data.locationLng),
        armamentLevel: data.armamentLevel,
        notes: data.notes,
        notifyBeforeHours: data.notifyBeforeHours ? Number(data.notifyBeforeHours) : 24,
        isDraft: !submit,
        attachments: attachments.map(a => ({ url: a.url, name: a.name, mimeType: a.mimeType }))
      };
      const res = await fetch(`/api/service-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشل الحفظ');
      }
      toast({ title: submit ? 'تم إرسال الطلب' : 'تم حفظ المسودة' });
      router.push('/client/tracking');
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className='flex items-center justify-center h-72'><Loader2 className='h-6 w-6 animate-spin' /></div>;
  if (!data) return null;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>تعديل مسودة طلب حارس شخصي</h1>
        <div className='flex gap-2'>
          <Button variant='secondary' onClick={() => router.back()}><Undo2 className='h-4 w-4 ml-1' />رجوع</Button>
          <Button variant='outline' disabled={saving} onClick={() => save(false)}>{saving ? <Loader2 className='h-4 w-4 animate-spin'/> : <Save className='h-4 w-4 ml-1'/>} حفظ</Button>
          <Button disabled={saving} onClick={() => save(true)}>{saving ? <Loader2 className='h-4 w-4 animate-spin'/> : <Send className='h-4 w-4 ml-1'/>} إرسال</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>الأساسيات</CardTitle></CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'><Label>العنوان</Label><Input value={data.title || ''} onChange={e => updateField('title', e.target.value)} /></div>
          <div className='space-y-2'><Label>عدد الأفراد</Label><Input type='number' value={data.personnelCount || ''} onChange={e => updateField('personnelCount', e.target.value)} /></div>
          <div className='space-y-2 md:col-span-2'><Label>الوصف</Label><Textarea value={data.description || ''} onChange={e => updateField('description', e.target.value)} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>التوقيت</CardTitle></CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='space-y-2'><Label>بداية</Label><Input type='datetime-local' value={data.startAt ? new Date(data.startAt).toISOString().slice(0,16) : ''} onChange={e => updateField('startAt', e.target.value)} /></div>
          <div className='space-y-2'><Label>نهاية</Label><Input type='datetime-local' value={data.endAt ? new Date(data.endAt).toISOString().slice(0,16) : ''} onChange={e => updateField('endAt', e.target.value)} /></div>
          <div className='space-y-2'><Label>الوحدة</Label>
            <Select value={data.durationUnit || 'HOURS'} onValueChange={(v) => updateField('durationUnit', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='HOURS'>ساعات</SelectItem>
                <SelectItem value='DAYS'>أيام</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>الموقع</CardTitle></CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='md:col-span-3 space-y-2'><Label>وصف الموقع</Label><Textarea value={data.locationText || ''} onChange={e => updateField('locationText', e.target.value)} /></div>
          <div className='space-y-2'><Label>Latitude</Label><Input type='number' step='0.000001' value={data.locationLat || ''} onChange={e => updateField('locationLat', e.target.value)} /></div>
          <div className='space-y-2'><Label>Longitude</Label><Input type='number' step='0.000001' value={data.locationLng || ''} onChange={e => updateField('locationLng', e.target.value)} /></div>
          <div className='space-y-2'><Label>مستوى التسليح</Label>
            <Select value={data.armamentLevel || 'STANDARD'} onValueChange={(v) => updateField('armamentLevel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='STANDARD'>قياسي</SelectItem>
                <SelectItem value='ARMED'>مسلح</SelectItem>
                <SelectItem value='SUPERVISOR'>مشرف</SelectItem>
                <SelectItem value='MIXED'>مزيج</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='md:col-span-3'>
            <MapPicker
              lat={typeof data.locationLat === 'number' ? data.locationLat : undefined}
              lng={typeof data.locationLng === 'number' ? data.locationLng : undefined}
              onChange={(c) => setData((p: any) => ({ ...p, locationLat: c.lat, locationLng: c.lng }))}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>ملاحظات</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={data.notes || ''} onChange={e => updateField('notes', e.target.value)} />
        </CardContent>
      </Card>
    </div>
  );
}
