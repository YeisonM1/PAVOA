export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`flex flex-col gap-4 animate-pulse ${className}`}>
      <div className="bg-stone-200 w-full relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="h-2.5 w-24 bg-stone-200 rounded" />
        <div className="h-3 w-16 bg-stone-100 rounded" />
      </div>
    </div>
  );
}