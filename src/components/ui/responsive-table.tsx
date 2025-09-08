"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-screen-size";

interface ResponsiveTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  data: any[];
  actions?: ReactNode;
  className?: string;
  onRowClick?: () => void;
}

export function ResponsiveTable({ headers, children, className = "" }: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={`space-y-3 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {headers.map((header, index) => (
              <th key={index} className="text-right p-3 font-semibold text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function ResponsiveTableRow({ data, actions, className = "", onRowClick }: ResponsiveTableRowProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Card className={`${className} ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onRowClick}>
        <CardContent className="p-4">
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <div className="text-sm font-medium">{item.value}</div>
              </div>
            ))}
            {actions && (
              <div className="pt-2 border-t flex gap-2 justify-end">
                {actions}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <tr className={`border-b hover:bg-muted/50 ${className} ${onRowClick ? 'cursor-pointer' : ''}`} onClick={onRowClick}>
      {data.map((item, index) => (
        <td key={index} className="p-3 text-right">
          {item.value}
        </td>
      ))}
      {actions && (
        <td className="p-3 text-right">
          <div className="flex gap-2 justify-end">
            {actions}
          </div>
        </td>
      )}
    </tr>
  );
}

// Helper component for status badges
interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'نشط':
      case 'paid':
      case 'مدفوع':
      case 'completed':
      case 'مكتمل':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'في الانتظار':
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'ملغي':
      case 'inactive':
      case 'غير نشط':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
      case 'مسودة':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} text-xs px-2 py-1 rounded-full border`}>
      {status}
    </Badge>
  );
}