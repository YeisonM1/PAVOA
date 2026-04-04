export default function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 w-[75vw] sm:w-[45vw] md:w-full animate-pulse">
      <div className="bg-stone-200 w-full" style={{ aspectRatio: '3/4' }}></div>
      <div className="flex flex-col items-center gap-2">
        <div className="h-3 w-3/4 bg-stone-200"></div>
        <div className="h-3 w-1/2 bg-stone-100"></div>
      </div>
    </div>
  );
}