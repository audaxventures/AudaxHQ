/**
 * Laptop + phone device frames wrapping real product screenshots (a sample
 * "NorthBridge Consulting" workspace) — a desktop clients view and a mobile
 * nav drawer, cropped to fill each frame.
 */
export function DeviceShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-md py-6 sm:py-10">
      <div className="rounded-2xl bg-navy-950 p-2.5 shadow-2xl sm:p-3">
        <div className="aspect-[16/10] overflow-hidden rounded-lg bg-cream-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- real product screenshot, not a candidate for next/image in this static marketing card */}
          <img
            src="/democlientweb.png"
            alt="AudaxHQ clients list showing active client accounts and balances"
            className="h-full w-full object-cover object-top"
          />
        </div>
      </div>
      <div className="mx-auto h-3 w-[85%] rounded-b-xl bg-navy-900" />
      <div className="mx-auto h-1.5 w-[35%] rounded-b-md bg-navy-800" />

      <div className="absolute -bottom-6 right-2 w-[30%] min-w-[104px] rounded-[1.75rem] border-[6px] border-navy-950 bg-navy-950 shadow-2xl sm:-bottom-8 sm:right-4">
        <div className="aspect-[1179/2247] overflow-hidden rounded-[1.4rem] bg-cream-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- real product screenshot, not a candidate for next/image in this static marketing card */}
          <img
            src="/demosidebarmobile.png"
            alt="AudaxHQ mobile navigation menu"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
