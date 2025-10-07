"use client";

import { Download, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentLinkProps {
  url: string;
  name: string;
  mimeType?: string;
  variant?: "default" | "outline" | "link";
  showIcon?: boolean;
}

export default function AttachmentLink({ 
  url, 
  name, 
  mimeType, 
  variant = "link",
  showIcon = true 
}: AttachmentLinkProps) {
  
  const isDataUrl = url.startsWith("data:");
  
  // Get file icon based on mime type
  const getIcon = () => {
    if (!showIcon) return null;
    if (mimeType?.includes("pdf")) return <FileText className="h-4 w-4" />;
    if (mimeType?.includes("image")) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDataUrl) {
      e.preventDefault();
      
      // For data URLs, trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = name || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    // For regular URLs, let the default behavior happen (opens in new tab)
  };

  if (variant === "link") {
    return (
      <a
        href={url}
        onClick={handleClick}
        target={isDataUrl ? undefined : "_blank"}
        rel={isDataUrl ? undefined : "noopener noreferrer"}
        className="text-blue-600 hover:underline flex items-center gap-2"
      >
        {getIcon()}
        <span className="truncate">{name}</span>
      </a>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      asChild={!isDataUrl}
    >
      {isDataUrl ? (
        <span className="flex items-center gap-2">
          {getIcon()}
          {name}
          <Download className="h-4 w-4 mr-1" />
        </span>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          {getIcon()}
          {name}
        </a>
      )}
    </Button>
  );
}
