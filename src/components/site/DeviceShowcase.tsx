/**
 * A single real lifestyle photo (someone reviewing the Clients page on their
 * desktop) rather than separate desktop/mobile device-frame mockups.
 */
export function DeviceShowcase() {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element -- real lifestyle photo, not a candidate for next/image in this static marketing card */}
      <img
        src="/clientsdesktopdesk.png"
        alt="A person reviewing their Verclara clients list on their desktop"
        className="h-auto w-full"
      />
    </div>
  );
}
