import { Select, Label, FieldGroup } from "@/components/ui/Field";
import { listTimezones } from "@/lib/timezone";

const TIMEZONES = listTimezones();

/** The timezone picker paired with a meeting's start-time field — same IANA list ProfileForm uses for the business-wide default. */
export function TimezoneField({ id = "timezone", defaultValue }: { id?: string; defaultValue: string }) {
  return (
    <FieldGroup>
      <Label htmlFor={id}>Timezone</Label>
      <Select id={id} name="timezone" defaultValue={defaultValue}>
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replace(/_/g, " ")}
          </option>
        ))}
      </Select>
    </FieldGroup>
  );
}
