import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const VehicleCardSkeleton = () => (
  <Card className="glass-card border-0">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton = () => (
  <Card className="glass-card border-0">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between py-4 border-b">
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-full max-w-[200px]" />
      <Skeleton className="h-3 w-full max-w-[150px]" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
);

export const ChartSkeleton = () => (
  <Card className="glass-card border-0">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32 mt-2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full" />
    </CardContent>
  </Card>
);

export const VehicleGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <VehicleCardSkeleton key={i} />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  </div>
);
