"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";

export type UploadedFile = {
  url: string;
  name: string;
  type?: string;
  size?: number;
};

export function UploadField({
  label = "المرفقات",
  onChange,
  multiple = true,
  folder = "service-requests",
}: {
  label?: string;
  onChange?: (files: UploadedFile[]) => void;
  multiple?: boolean;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<UploadedFile[]>([]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const results: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("filename", file.name);
        fd.append("folder", folder);

        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
        const data = await res.json();
        results.push({ url: data.url, name: data.name, type: data.type, size: data.size });
      }

      const next = multiple ? [...items, ...results] : [results[0]];
      setItems(next);
      onChange?.(next);
    } catch (e) {
      // Silent; parent can show a toast if desired
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input ref={inputRef} type="file" multiple={multiple} onChange={handleSelect} />
        <Button type="button" variant="secondary" disabled>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="text-sm list-disc pr-4 space-y-1">
          {items.map((f, i) => (
            <li key={i} className="truncate">
              <a className="text-primary hover:underline" href={f.url} target="_blank" rel="noreferrer">
                {f.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
