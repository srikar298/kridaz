# Booking Module

> **Domain Owner**: Backend Team  
> **Mounted at**: `/api/booking`  
> **Last Updated**: May 2026

---

## What Does This Module Do?

The Booking module handles the complete lifecycle of a turf slot reservation on the Kridaz platform — from payment initiation to booking confirmation, cancellation, and invoice generation.

---

## File Structure

```
booking/
├── routes/
│   ├── user.routes.js      # User-facing endpoints (create order, verify, wallet, cancel)
│   ├── owner.routes.js     # Owner-facing endpoints (view bookings, manual booking)
│   └── admin.routes.js     # Admin-facing endpoints (platform-wide view, filters)
├── booking.routes.js       # Entry point — mounts sub-routers
├── booking.controller.js   # HTTP handlers (req/res glue)
├── booking.service.js      # Pure business logic (no HTTP — reusable)
├── booking.validator.js    # Zod input schemas
└── README.md               # You are here
```

---

## URL Reference

| Method | Path                                 | Auth      | Description                          |
| :----- | :----------------------------------- | :-------- | :----------------------------------- |
| `POST` | `/api/booking/user/create-order`     | User JWT  | Create Razorpay order                |
| `POST` | `/api/booking/user/verify-payment`   | User JWT  | Verify payment & confirm booking     |
| `POST` | `/api/booking/user/book-with-wallet` | User JWT  | Pay via Kridaz wallet                |
| `POST` | `/api/booking/user/validate-coupon`  | User JWT  | Check coupon validity                |
| `GET`  | `/api/booking/user/all`              | User JWT  | List my bookings                     |
| `POST` | `/api/booking/user/cancel/:id`       | User JWT  | Cancel a booking (30% refund policy) |
| `GET`  | `/api/booking/user/invoice/:id`      | Public    | Download PDF invoice                 |
| `GET`  | `/api/booking/user/:id`              | Public    | Get booking by ID (QR scan)          |
| `GET`  | `/api/booking/owner/all`             | Owner JWT | View all bookings for my turfs       |
| `POST` | `/api/booking/owner/manual`          | Owner JWT | Create walk-in booking (cash/UPI)    |
| `GET`  | `/api/booking/admin/all`             | Admin JWT | Platform-wide booking view           |

---

## Business Rules

### Payment Flow

1. Frontend calls `POST /create-order` to get a Razorpay `order_id`
2. Razorpay SDK opens the payment modal on the client
3. On success, Razorpay returns `paymentId`, `orderId`, `signature`
4. Frontend calls `POST /verify-payment` — the server validates the HMAC signature
5. If valid: TimeSlot is created, Booking record is saved, QR code and confirmation email are sent

### Cancellation Policy (30% Refund)

- A booking can only be cancelled if its status is `CONFIRMED`
- The user receives a **30% refund** of the `paidAmount` credited to their Kridaz wallet
- Bookings in `PLAYING`, `COMPLETED`, or `DISPUTED` status **cannot** be cancelled

### Manual Bookings (Owner)

- Venue owners can create bookings for walk-in customers
- `bookingSource` is set to `PARTNER_MANUAL`
- No Razorpay order is created; `paymentMethod` defaults to `CASH`

### Rate Limiting

Payment-sensitive endpoints are protected by `paymentLimiter`:

- `10 requests per 15 minutes` per IP
- Applied **at the route level** in `routes/user.routes.js`, not in `app.js`

---

## How to Add a New Booking Endpoint

1. Decide which actor needs it: `user`, `owner`, or `admin`
2. Add the controller function to `booking.controller.js`
3. If reusable logic is needed, add a helper to `booking.service.js`
4. Add the route to the correct `routes/*.routes.js` file
5. Add a JSDoc `@swagger` comment above the route
6. **Do NOT touch** `server/routes/index.js` or `server/app.js`

---

## Database Models Involved

- `Booking` — The core record
- `TimeSlot` — Linked slot (1:1 with a confirmed booking)
- `WalletTransaction` — Created on wallet payment or refund
- `Turf` — The venue being booked
- `User` — The customer
- `OwnerProfile` — The venue operator

See the full ERD at: `/docs/database/erd` on the developer portal.
