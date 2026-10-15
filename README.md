# The Ice Realm

This is a turf-booking website for The Ice Realm's football grounds across Maharashtra, Delhi and India's metro cities. Players pick a city, a ground and an hour, pay with GPay (UPI), and get a match ticket.

- **Website:** React 19 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui (`frontend-next/`)
- **Back end:** Spring Boot 4 + Java 21 + JPA (`backend/`), with H2 by default and MySQL optional. It also serves the built website, so one server runs everything.
- **Previous design:** the v3 "Deep Field" site in `frontend/` still works against the same API, kept for reference
- **Docs:** [architecture](docs/architecture.md), [start-up cost analysis](docs/cost-analysis.md)

## Run it

You need JDK 21+ and Node 20+. On this machine they are in `~/.local` (Node is already on the PATH in `~/.zshrc`):

```bash
export JAVA_HOME=~/.local/jdk-21/Contents/Home
export PATH=$JAVA_HOME/bin:~/.local/node-22/bin:$PATH
```

**Everything on one server** (for demos):

1. Build the website into the back end:
   ```bash
   cd frontend-next
   npm install
   npm run build:backend
   ```
2. Start Spring Boot:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   The first run fills the database with sample cities and grounds.
3. Open http://localhost:8080. The staff page is http://localhost:8080/admin. Its code is in `backend/secrets.yml`, a private file that stays on this machine (without it, the code is `frostbite`).

**While working on the website**, keep Spring Boot running and start the website's dev server in a second terminal. It reloads as you edit, and passes `/api` calls to Spring Boot:

```bash
cd frontend-next
npm run dev
```

Then open http://localhost:5174.

**Checks:** `cd backend && ./mvnw test` runs the 40 back-end tests. `cd frontend-next && npm run typecheck && npm run lint` checks the website.

**Database console:** it's off by default, because anyone who can open it can read and change every booking. For local debugging, start the backend with `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` and open http://localhost:8080/h2-console.

**Putting it online:** the live site is **https://the-ice-realm.github.io**: the website on GitHub Pages and the API on Render's free plan, both redeployed on every push. [docs/deploy.md](docs/deploy.md) covers that, a quick public link from this Mac (Cloudflare Tunnel), and always-on hosting (Railway, using the `Dockerfile`).

### Before going live

| What | Where |
|---|---|
| UPI ID that receives payments | `app.upi.vpa` in `backend/src/main/resources/application.yml` |
| Staff code for `/admin` | `backend/secrets.yml` on this machine; the `ICE_REALM_ADMIN_TOKEN` variable on a host, where the app won't start without one |
| Logo and name | `frontend-next/src/assets/brand/` (crest, small mark, and the Ice Realm wordmark) and `frontend-next/public/favicon.png` |
| Ground photos | Save a photo as `frontend-next/src/assets/arenas/<ground slug>.jpg`, e.g. `lokhandwala.jpg`, then rebuild. Grounds without one use the stock photo URL from `DataSeeder.java`. |
| Real venues and prices | `backend/.../config/DataSeeder.java`: grounds and pitches in `seedGrounds`, card details (photo, rating, highlight, lighting, map position) in `LISTINGS`. Delete `backend/data/` to reseed. |
| MySQL instead of H2 | `./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql` |

## How payment works

1. Booking holds the slot for 15 minutes.
2. The checkout page shows a UPI QR code and a **Pay with GPay** button. Both carry a `upi://pay` link with the exact amount and the booking reference as the note.
3. The player pays, then types the 12-digit UTR from their GPay receipt.
4. Staff open `/admin`, match the UTR against the bank statement and press **Confirm**. The player's ticket shows "Confirmed" within a few seconds.

Unpaid holds expire automatically, and players can cancel an unpaid hold themselves from **My fixtures**. Rejected payments free the slot.

## Course outcomes, and where to find them

| Outcome | Where it's shown |
|---|---|
| Java fundamentals and OOP | Entities with encapsulated state and behaviour (`model/Booking.java`: `submitPayment`, `confirm`, `release`; `model/Venue.java`: `describeListing`), the `model/GeoPoint.java` value object that validates itself and owns the distance maths, constructor injection throughout |
| Inheritance | `model/Turf.java` (abstract) → `FiveASideTurf`, `SevenASideTurf`, `FutsalArena`, which override `getCapacity`, `getBaseHourlyRate` and `describe`. `pricing/PricingStrategy` → `MultiplierPricing` (abstract) → `WeekendPricing`, `PeakPricing`, `OffPeakPricing` |
| Exception handling | `exception/IceRealmException` hierarchy with six subclasses (including `InvalidLocationException` for "turfs near me"), and the `GlobalExceptionHandler` that maps them to one JSON error shape. Tested in `ApiErrorTest`, `BookingServiceTest` and `CatalogServiceTest` |
| Financial planning and cost analysis | [`docs/cost-analysis.md`](docs/cost-analysis.md), `finance/CostAnalysisService.java` (break-even, ROI, sensitivity), `GET /api/finance/summary` |
| JavaScript for interactive web | In `frontend-next/src/`: the live slot grid with 1–3 hour runs and form validation (`components/BookingDialog.tsx`); the 15-minute hold countdown, UPI QR code, UTR form and polling for confirmation (`components/Checkout.tsx`); browser geolocation for "turfs near me" (`lib/location.ts`); and the WebGL freezing crest (`lib/freezeRenderer.ts`) |
| React | Components, routing with `react-router-dom` (`App.tsx`), hooks (`lib/useApi.ts`, `lib/useNow.ts`, `lib/fixtures.ts`), controlled forms, and TypeScript types that mirror the Java DTOs (`types/index.ts`) |
| Spring Framework, enterprise level | Layered controller → service → repository design, Spring Data JPA, `@Transactional`, bean validation, `@ConfigurationProperties`, `@Scheduled` jobs, profiles (H2/MySQL), CORS config, serving the built website (`controller/SiteController.java`), and `@SpringBootTest` + MockMvc tests |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/cities` | Cities with venue counts |
| GET | `/api/cities/{slug}/venues` | Grounds in a city |
| GET | `/api/cities/{slug}/open-slots?date=` | The soonest free hours, for the home page |
| GET | `/api/venues` | Every ground, with its card details and turfs |
| GET | `/api/venues/near?lat=&lng=` | Grounds nearest first, with distances in km |
| GET | `/api/venues/{id}` | One ground and its turfs |
| GET | `/api/availability?from=&days=` | Free hours per turf per day, for the cards and date picker |
| GET | `/api/turfs/{id}/slots?date=` | Hourly grid with prices |
| POST | `/api/bookings` | Hold a slot |
| GET | `/api/bookings/{ref}?phone=` | Look up a booking |
| POST | `/api/bookings/{ref}/utr` | Submit payment reference |
| POST | `/api/bookings/{ref}/cancel` | Cancel an unpaid hold (body: `phone`) |
| GET | `/api/admin/bookings?status=` | Staff list (header `X-Admin-Token`) |
| POST | `/api/admin/bookings/{ref}/confirm` and `/reject` | Staff actions |
| GET | `/api/finance/summary` | Cost analysis |
