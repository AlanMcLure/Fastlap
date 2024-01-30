import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[150px] w-full rounded-xl" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}