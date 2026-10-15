import { useEffect, useRef, type RefObject } from "react";
import { Checkout } from "@/components/Checkout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BookingDto } from "@/types";

interface PaymentDialogProps {
  payment: { booking: BookingDto; phone: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (booking: BookingDto) => void;
  /** Where keyboard focus goes when the dialog closes. */
  returnFocus: RefObject<HTMLElement | null>;
}

/** Pay for (or follow) a booking that was held earlier, opened from My fixtures. */
export function PaymentDialog({ payment, open, onOpenChange, onChange, returnFocus }: PaymentDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="booking-dialog"
        data-testid="payment-dialog"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        {payment && (
          <Checkout
            booking={payment.booking}
            phone={payment.phone}
            titleRef={titleRef}
            onChange={onChange}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
