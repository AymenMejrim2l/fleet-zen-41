import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileTableProps {
  headers: string[];
  data: Record<string, React.ReactNode>[];
  keyField?: string;
  className?: string;
}

export const MobileTable = ({ headers, data, keyField = "id", className }: MobileTableProps) => {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {headers.map((header, idx) => (
                <th key={idx} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row[keyField] as string || idx} className="border-b transition-colors hover:bg-muted/50">
                {Object.values(row).map((cell, cellIdx) => (
                  <td key={cellIdx} className="p-4 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={cn("md:hidden space-y-4", className)}>
        {data.map((row, idx) => (
          <Card key={row[keyField] as string || idx} className="glass">
            <CardContent className="pt-6 space-y-3">
              {Object.entries(row).map(([key, value], entryIdx) => (
                <div key={entryIdx} className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                    {headers[entryIdx] || key}
                  </span>
                  <div className="flex-1 text-right text-sm">{value}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};
