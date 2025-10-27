"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ClipboardList, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface ActivityLogItem {
  id: string;
  createdAt: string;
  actionType: string;
  description: string;
  metadata?: any;
  user?: { id: string; name?: string | null; email?: string | null; role?: string | null } | null;
}

const STORAGE_KEY = "adminNotifications.lastSeen";

export function NotificationBell() {
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<Date | null>(() => {
    const t = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return t ? new Date(t) : null;
  });
  const router = useRouter();
  const knownIdsRef = useRef<Set<string>>(new Set());

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) return items.length;
    return items.filter((i) => new Date(i.createdAt) > lastSeenAt).length;
  }, [items, lastSeenAt]);

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880; // Hz
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.start();
      o.stop(ctx.currentTime + 0.22);
    } catch {}
  }

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/activity-log?limit=20&dateRange=7d");
      if (!res.ok) return;
      const data: ActivityLogItem[] = await res.json();
      const onlyNewRequests = data.filter((d) =>
        (d.metadata?.originalActionType ?? d.actionType) === "SERVICE_REQUEST_SUBMITTED"
      );
      // Detect new arrivals to beep once
      const prevIds = knownIdsRef.current;
      const newOnes = onlyNewRequests.filter((i) => !prevIds.has(i.id));
      if (newOnes.length > 0 && prevIds.size > 0) {
        playBeep();
      }
      knownIdsRef.current = new Set(onlyNewRequests.map((i) => i.id));
      setItems(onlyNewRequests);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000); // poll every 30s
    return () => clearInterval(id);
  }, []);

  const markAllAsRead = () => {
    try {
      const now = new Date();
      window.localStorage.setItem(STORAGE_KEY, now.toISOString());
      setLastSeenAt(now);
      setOpen(false);
    } catch {}
  };

  function getRequestId(item: ActivityLogItem): string | null {
    const meta = item.metadata || {};
    const fromTarget = meta?.target?.id ?? null;
    const fromDetails = meta?.details?.requestId ?? null;
    return fromTarget || fromDetails || null;
  }

  function openRequest(item: ActivityLogItem) {
    const id = getRequestId(item);
    if (!id) return;
    router.push(`/admin/service-requests/${id}`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">إشعارات الطلبات</div>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            تعليم الكل كمقروء
          </Button>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">جاري التحديث...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openRequest(item)}
                className="w-full text-left p-3 border rounded-lg flex items-start gap-3 hover:bg-muted/60 transition"
              >
                <div className="mt-0.5">
                  <ClipboardList className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.description}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <User className="h-3 w-3" />
                    <span>{item.user?.name || "عميل"}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleString("ar-EG")}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-blue-700 border-blue-200">جديد</Badge>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
