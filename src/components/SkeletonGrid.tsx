interface SkeletonCardProps {
  count?: number
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3">
      {/* Thumbnail */}
      <div className="skeleton aspect-video w-full" />
      {/* Title lines */}
      <div className="flex flex-col gap-2 px-1">
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg mt-1" style={{ opacity: 0.6 }} />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 12 }: SkeletonCardProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
