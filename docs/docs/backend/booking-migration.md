---
sidebar_position: 7
title: Booking Migration Plan
---

# Implementation Plan: Booking Service Layer Extraction

## Gold Standard Refactoring

This document maps out the comprehensive plan to transition the Booking module from a controller-driven structure to a clean, service-oriented architecture (layered LLD architecture).

---

## 1. Objectives & Guidelines

1. **Pure Separation of Concerns**:
   - **Controller Layer (`booking.controller.js`)**: Responsible ONLY for HTTP concerns: parsing request parameters, invoking the service layer, returning corresponding HTTP responses (with statuses), and error handling mapping. No Prisma queries, transactions, or business validation logic.
   - **Service Layer (`booking.service.js`)**: Pure business logic and database queries/mutations. Accepts plain data inputs, handles transactions, permissions/business constraints, cashback calculation, system settings parameters, metrics updates, and queues emails/in-app notifications. Throws explicit errors with optional status codes if validations fail.
2. **Backward Compatibility**:
   - Zero changes to routes, validators, or APIs.
   - All tests in `booking.test.js` MUST pass successfully after migration.
3. **Enterprise Robustness**:
   - Preserve all transaction blocks, performance optimizations, metrics reporting, and logging exactly.
   - Ensure proper cleanup and correct imports.

---

## 2. Refactoring Map

| Endpoint Controller Function | Target Service Function         | Responsibilities Transferred                                                                                                                                                                                                                                                                                                                    |
| :--------------------------- | :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createOrder`                | `createRazorpayOrder`           | Fetch User, create Razorpay Order options, instantiate Razorpay order.                                                                                                                                                                                                                                                                          |
| `verifyPayment`              | `verifyBookingPayment`          | Signature verification, fetch user/turf/settings, overlapping booking check, transaction (TimeSlot + Booking + Owner pending balance increment), QR code generation/update, enqueue notifications (in-app + email confirmation/invoice pdf).                                                                                                    |
| `bookWithWallet`             | `processWalletBooking`          | Fetch user/turf/settings, validate wallet balance, overlapping booking check, transaction (deduct wallet, create TimeSlot, create Booking, increment owner pending balance, increment coupon usage, create wallet debit transaction, process cashback logic + offer wallet transaction), QR code generation/update, enqueue owner notification. |
| `getBookingById`             | `findBookingDetailsById`        | Query booking by ID with comprehensive user/turf/owner/timeSlot joins.                                                                                                                                                                                                                                                                          |
| `getUserBookings`            | `findBookingsByUser`            | Fetch bookings matching userId with all details (timeSlot, turf), ordered by creation date.                                                                                                                                                                                                                                                     |
| `getOwnerBookings`           | `findBookingsByOwner`           | Fetch turfs matching owner's userId, fetch all bookings on those turfs, join user/turf/timeSlot, format results to shape expected by frontend.                                                                                                                                                                                                  |
| `validateCoupon`             | `verifyCoupon`                  | Query coupon, validate expiry, turf validity, usage limit, compute percentage or flat discount and final price.                                                                                                                                                                                                                                 |
| `createManualBooking`        | `processManualBooking`          | Turf/owner authorization check, parse and adjust time slot parameters with time-zone adjustments, overlapping slot check, transaction (TimeSlot + Manual Booking creation), QR code generation/update.                                                                                                                                          |
| `downloadInvoice`            | _Uses `findBookingDetailsById`_ | Fetches the booking details from the service layer, constructs invoice parameters, returns PDF stream.                                                                                                                                                                                                                                          |
| `cancelBooking`              | `processBookingCancellation`    | Fetch booking, owner validation, verify cancel timeline (72 hours prior), transaction (Booking status to CANCELLED, refund calculation & user wallet balance increment, create refund wallet transaction, deduct owner pending balance, delete TimeSlot), enqueue customer in-app notification.                                                 |
| `getAdminAllBookings`        | `findAdminBookings`             | Parse pagination details, form queries, retrieve paginated booking list and count matching filters.                                                                                                                                                                                                                                             |

---

## 3. Step-by-Step Execution Plan

### Step 1: Design and Populate `booking.service.js`

- Keep existing lightweight helper functions (`isSlotAvailable`, `findBookingById`, `calculateCancellationRefund`).
- Add the advanced service functions matching the design above.
- Import dependencies: Prisma client, Razorpay instance, date-fns (including date-fns-tz), crypto, metrics helpers, QR code generator, email/invoice utilities, and NotificationService.

### Step 2: Refactor `booking.controller.js`

- Import all service functions from `./booking.service.js`.
- Replace inline database operations in controllers with asynchronous service calls.
- Wrap service calls inside `try-catch` blocks that handle standard error mapping (using `error.statusCode || 500` and `error.message`).

### Step 3: Local Verification

- Run standard booking module unit tests via local jest configuration.
- Verify zero disruption to any existing APIs.
