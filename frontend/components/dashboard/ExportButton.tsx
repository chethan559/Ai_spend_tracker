'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
  data: Record<string, unknown>[] | Record<string, unknown> | null | undefined;
  filename: string;
}

const buildFilename = (baseName: string, ext: string) => {
  const dateStamp = new Date().toISOString().split('T')[0];
  return `${baseName}-${dateStamp}.${ext}`;
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) {
    return '';
  }

  const headers = Array.from(
    rows.reduce((acc, row) => {
      Object.keys(row).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>()),
  );

  const escapeValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeValue(row[header])).join(','));
  });

  return lines.join('\n');
};

export default function ExportButton({ data, filename }: ExportButtonProps) {
  const rows = Array.isArray(data) ? data : data ? [data] : [];

  const exportAsCsv = () => {
    try {
      if (!rows.length) {
        toast.error('No data to export');
        return;
      }
      const csv = toCsv(rows);
      downloadFile(csv, buildFilename(filename, 'csv'), 'text/csv');
      toast.success('Exported CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const exportAsJson = () => {
    try {
      if (!rows.length) {
        toast.error('No data to export');
        return;
      }
      const json = JSON.stringify(rows, null, 2);
      downloadFile(json, buildFilename(filename, 'json'), 'application/json');
      toast.success('Exported JSON');
    } catch (error) {
      toast.error('Failed to export JSON');
    }
  };

  const exportAsPdf = () => {
    toast.info('PDF export is coming soon');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsCsv}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJson}>Export as JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPdf}>Export as PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
