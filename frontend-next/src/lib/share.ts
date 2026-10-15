import { toast } from "sonner";
import { matchday, shortName } from "@/lib/booking";
import type { BookingDto } from "@/types";

/** Opens the device's share sheet with the fixture, or copies it where sharing isn't available. */
export async function shareFixture(booking: BookingDto) {
  const where = `${shortName(booking.venueName)}, ${booking.area} (${booking.turfName}, ${booking.format})`;
  const text = `Ice Realm fixture: ${where}, ${matchday(booking.date).long}, ${booking.timeLabel}. Booking ${booking.ref}.`;

  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: "Ice Realm fixture", text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Fixture details copied", { description: "Paste them into your squad chat." });
  } catch (error) {
    // Closing the share sheet isn't a failure.
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Couldn't share the fixture", { description: `Your booking code is ${booking.ref}.` });
  }
}
