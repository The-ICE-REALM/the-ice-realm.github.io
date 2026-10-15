# Architecture

## System

```
 Browser (React, Vite)                       Spring Boot 4 (Java 21)                    H2 / MySQL
┌────────────────────────┐   /api/* JSON   ┌───────────────────────────────┐   JPA   ┌───────────┐
│ Home: arenas, near me  │ ──────────────▶ │ controller/  REST endpoints   │ ──────▶ │ city      │
│  booking dialog (slots)│                 │ service/     booking rules    │         │ venue     │
│  UPI checkout (QR, UTR)│ ◀────────────── │ pricing/     strategy pattern │ ◀────── │ turf      │
│  My fixtures           │   ApiError on   │ exception/   error hierarchy  │         │ booking   │
│ /admin: staff payments │   every failure │ finance/     cost analysis    │         │ booked_   │
│ (frontend-next/)       │                 │ HoldExpiryJob (every minute)  │         │   slot    │
└────────────────────────┘                 └───────────────────────────────┘         └───────────┘
            │
            │ upi://pay?pa=…&am=…&tn=IR-XXXXXX
            ▼
      GPay / any UPI app ──▶ money lands in The Ice Realm's UPI account
```

## Booking lifecycle

```
            create                 submit UTR               staff confirm
  (none) ──────────▶ PENDING_PAYMENT ─────────▶ PAYMENT_SUBMITTED ─────────▶ CONFIRMED
                          │                           │
                          │ 15 min, no UTR            │ staff reject
                          ▼                           ▼
                       EXPIRED                    CANCELLED          (both free the slot)
```

Every hour a booking holds is a `BookedSlot` row. A database unique key on (turf, date, hour) makes double booking impossible, even when two players press "Book" at the same moment.

## Inheritance

```
               «abstract» Turf
               ─────────────────────────
               + getCapacity()       abstract
               + getBaseHourlyRate() abstract
               + getFormat()         abstract
               + describe()          "<format> for up to <n> players"
                 ▲          ▲            ▲
   ┌─────────────┘          │            └──────────────┐
FiveASideTurf         SevenASideTurf            FutsalArena
10 players, ₹1,200    14 players, ₹1,800        10 players, ₹1,500
                      describe() + subs         describe() + indoors
```

All three formats are stored in one `turf` table (`SINGLE_TABLE`) and told apart by a `turf_type` column.

```
          «interface» PricingStrategy
                     ▲
        «abstract» MultiplierPricing     price = base × city factor × multiplier, rounded to ₹50
          ▲             ▲             ▲
   WeekendPricing   PeakPricing   OffPeakPricing
     ×1.25 @Order 1   ×1.2 @Order 2  ×1.0 @Order 3
```

`PricingService` receives all three strategies in `@Order` and uses the first whose `appliesTo(date, hour)` is true.

## Exception handling

```
RuntimeException
  └── «abstract» IceRealmException       getCode(), getStatus()
        ├── SlotAlreadyBookedException    409  SLOT_ALREADY_BOOKED
        ├── ResourceNotFoundException     404  NOT_FOUND
        ├── InvalidBookingException       422  INVALID_BOOKING
        ├── PaymentVerificationException  409  PAYMENT_NOT_ACCEPTED
        ├── AdminAccessDeniedException    401  ADMIN_ACCESS_DENIED
        └── InvalidLocationException      400  INVALID_LOCATION
```

`GlobalExceptionHandler` (`@RestControllerAdvice`) has one handler for the whole family. It also handles:
- bean-validation failures (400, with per-field messages)
- database unique-key clashes (mapped to 409)
- anything unexpected (500, logged)

Every error reaches the browser in the same shape:

```json
{ "code": "SLOT_ALREADY_BOOKED", "message": "Someone just booked 7–8 pm. Pick another slot.",
  "timestamp": "2026-10-02T10:41:16Z", "fieldErrors": {} }
```

The React app shows `message` as-is, so every error tells the player what to do next.
