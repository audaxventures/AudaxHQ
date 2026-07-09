function PlaceholderScreen({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center border border-dashed border-navy-200 bg-cream-100">
      <span className="px-4 text-center text-[11px] font-medium text-navy-400">{label}</span>
    </div>
  );
}

/**
 * Laptop + phone device frames with placeholder screens — swap the
 * PlaceholderScreen elements below for real <img> screenshots once available.
 */
export function DeviceShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-md py-6 sm:py-10">
      <div className="rounded-2xl bg-navy-950 p-2.5 shadow-2xl sm:p-3">
        <div className="aspect-[16/10] overflow-hidden rounded-lg bg-cream-50">
          <PlaceholderScreen label="Dashboard screenshot" />
        </div>
      </div>
      <div className="mx-auto h-3 w-[85%] rounded-b-xl bg-navy-900" />
      <div className="mx-auto h-1.5 w-[35%] rounded-b-md bg-navy-800" />

      <div className="absolute -bottom-6 right-2 w-[30%] min-w-[104px] rounded-[1.75rem] border-[6px] border-navy-950 bg-navy-950 shadow-2xl sm:-bottom-8 sm:right-4">
        <div className="aspect-[9/19.5] overflow-hidden rounded-[1.4rem] bg-cream-50">
          <PlaceholderScreen label="To-dos screenshot" />
        </div>
      </div>
    </div>
  );
}
