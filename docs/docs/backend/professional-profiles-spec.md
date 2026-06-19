# Kridaz Professional Profiles — Feature Implementation Specification

This specification provides a complete, developer-ready blueprint for implementing professional profiles on the Kridaz platform. It covers **Overview, Bookings (Slots & Packets), Customers CRM, Earnings, Payouts, and Feedback (Reviews & Requests)**.

No project source code has been modified; this document acts as a comprehensive reference for backend and frontend developers.

---

## 1. Overview Page (Landing Dashboard)

The Overview page serves as the entry point dashboard for all professional roles (**Coach, Umpire, Scorer, Commentator, Streamer**). It aggregates data from multiple modules to present a real-time summary of activity, earnings, and reputation.

### 1.1 Functional Purpose

- Provide a single-pane snapshot of the professional's operational status.
- Display critical action items (pending bookings, unread reviews, outstanding payouts).
- Offer navigation entry points to other pages.

### 1.2 UI Sections & Data Entities

1.  **KPI Cards Row**:
    - **Total Bookings**: Integer count of all confirmed bookings matching the professional's ID.
    - **Upcoming Sessions**: Integer count of bookings where `sessionDate` is greater than or equal to today and `status` is `confirmed`.
    - **Total Earnings**: Sum of all `netAmount` values in the completed earnings ledger.
    - **Average Rating**: Calculated average of the `rating` values left by customers in the Review system.
2.  **Recent Bookings Mini-Table**:
    - Displays the last 5 booking records.
    - Fields: Booking ID, Venue/Turf Name, Sport, Date, and status badges (`pending`, `confirmed`, `completed`, `cancelled`).
3.  **Earnings Trend Chart**:
    - A visual bar chart rendering the last 6 months of earnings grouped by month.
4.  **Pending Alerts Banner**:
    - A warning strip highlighting pending requests, new feedback, or pending payout releases.
    - _Note: These alerts are query-based and do not require a separate notifications collection._

### 1.3 Role Differences

- **Coach**: The "Bookings" KPI card displays _"Total Packets + Sessions"_.
- **All Other Roles**: Displays _"Total Sessions"_.

---

## 2. Bookings Page

The Bookings page is split into two tabs: **Slot Management** (available to all roles) and **Packet Management** (Coaches only).

### 2A. Slot Management (All Roles)

Allows professionals to manage their calendars, set availability, and handle booking requests.

#### 2A.1 Availability Configuration

Professionals can define two types of availability schedules:

1.  **Recurring Slots**: Weekday-based schedules (e.g., Every Monday and Wednesday from 09:00 to 11:00). The system automatically generates slots in the database for the next N days (default: 30 days).
2.  **Custom Date Ranges**: Fixed, non-recurring slots for specific dates and times (e.g., Tournament officiating on October 12, 14:00 to 20:00).

#### 2A.2 Entity Schema Definitions

##### BookingSlot Entity

Represents a block of available, booked, or blocked time for a professional.

| Field            | Type              | Required | Description                               |
| :--------------- | :---------------- | :------- | :---------------------------------------- |
| `_id`            | ObjectId / String | Yes      | Unique slot ID                            |
| `professionalId` | ObjectId / String | Yes      | ID of the professional (User ref)         |
| `slotDate`       | Date              | Yes      | Calendar date of availability             |
| `startTime`      | String            | Yes      | Start time in "HH:MM" format              |
| `endTime`        | String            | Yes      | End time in "HH:MM" format                |
| `sport`          | String            | Yes      | Associated sport (e.g. Cricket, Football) |
| `isRecurring`    | Boolean           | Yes      | Flag for recurring slot generation        |
| `recurringDay`   | String            | No       | Day of the week if `isRecurring` is true  |
| `status`         | Enum              | Yes      | `open`, `booked`, `blocked`, `cancelled`  |
| `bookingId`      | ObjectId / String | No       | Linked booking ID once reserved           |

##### Booking Entity (Professional Relevant Fields)

Represents a slot reservation session paid for by a customer.

| Field               | Type              | Required | Description                                      |
| :------------------ | :---------------- | :------- | :----------------------------------------------- |
| `_id`               | ObjectId / String | Yes      | Unique booking ID                                |
| `bookingFor`        | Enum              | Yes      | `slot` (single session) or `packet` (bundle)     |
| `professionalId`    | ObjectId / String | Yes      | Associated professional ID                       |
| `userId`            | ObjectId / String | Yes      | ID of the customer who booked                    |
| `turfId`            | ObjectId / String | No       | Linked physical turf location (optional)         |
| `sport`             | String            | Yes      | Sport category                                   |
| `sessionDate`       | Date              | Yes      | Scheduled date of the session                    |
| `startTime`         | String            | Yes      | Start time ("HH:MM")                             |
| `endTime`           | String            | Yes      | End time ("HH:MM")                               |
| `amount`            | Number            | Yes      | Transaction amount in INR                        |
| `status`            | Enum              | Yes      | `pending`, `confirmed`, `completed`, `cancelled` |
| `razorpayOrderId`   | String            | Yes      | Payment system order reference                   |
| `razorpayPaymentId` | String            | No       | Payment gateway transaction ID                   |

#### 2A.3 Calendar UI & Interactions

- **Weekly Grid**: Monday-to-Sunday layout.
- **Color Codes**: `open` = Green, `booked` = Blue, `blocked` = Grey, `cancelled` = Red.
- **Actions**: Clicking an `open` slot blocks it. Clicking a `booked` slot opens the customer detail drawer.

---

### 2B. Packet Management (Coaches Only)

Packets are multi-session coaching packages sold as structured training bundles (e.g., 10 batting masterclass sessions over 4 weeks).

#### 2B.1 Create / Edit Coach Packets

Coaches configure training packets using these fields:

##### CoachPacket Entity

Defines the coaching package blueprint.

| Field           | Type              | Required | Description                                |
| :-------------- | :---------------- | :------- | :----------------------------------------- |
| `_id`           | ObjectId / String | Yes      | Unique packet ID                           |
| `coachId`       | ObjectId / String | Yes      | Owning coach's ID                          |
| `title`         | String            | Yes      | Display name of the packet                 |
| `sport`         | String            | Yes      | Associated sport                           |
| `totalSessions` | Number            | Yes      | Total number of sessions included          |
| `durationDays`  | Number            | Yes      | Calendar days the packet is valid          |
| `sessionDays`   | Array of String   | Yes      | Scheduled weekdays (e.g. `["Mon", "Fri"]`) |
| `sessionTime`   | String            | Yes      | Fixed daily session time ("HH:MM")         |
| `price`         | Number            | Yes      | Total package price in INR                 |
| `maxStudents`   | Number            | Yes      | Maximum concurrent enrollees allowed       |
| `description`   | String            | No       | Optional details (Markdown supported)      |
| `isActive`      | Boolean           | Yes      | Toggles visibility to players              |

#### 2B.2 Auto-Generation Rules

- When a packet is saved, the backend automatically generates individual `BookingSlot` records for every weekday matched in the `sessionDays` array during the `durationDays` window.
- These slots are linked via `packetId`. Coaches can reschedule individual sessions, which cancels the current slot and creates a replacement date.

#### 2B.3 Packet Enrolments Table

- **Enrolment Columns**: User Name, Purchase Date, Attendance Ratio (Sessions Attended / Total), Price Paid, and Status.
- **Refund Action**: Triggers a partial or full refund through the Razorpay refund API, updating the enrollment status to `cancelled`.

---

## 3. Customers List Page

A CRM-style directory listing all players who have booked sessions or enrolled in coaching packets with the professional.

### 3.1 Data Aggregation Rules

- Queries both `Booking` and `PacketEnrolment` collections, group by `userId`.
- Joins with the `User` database model to retrieve contact info and profile pictures.

### 3.2 Table Columns & CRM Data

- **Avatar & Name**: Displays the user's profile image and display name.
- **Contact Info**: Email and phone number (subject to user privacy settings).
- **Sports**: Lists all sports in which the user has booked sessions.
- **Total Sessions**: Count of all `completed` bookings.
- **Packets Enrolled**: Count of coaching packages purchased (visible to Coaches only).
- **Last Session**: Date of the most recent booking.
- **Total Spent**: Sum of all confirmed session fees.

### 3.3 Customer Detail Drawer

Clicking a customer row opens a slide-over panel (no page redirect):

- **Profile Summary**: Profile statistics, account creation dates, and totals.
- **Roster History**: List of bookings, attendance reports, and reviews.
- _Note: Direct chat messaging is out of scope. Contacts are display-only._

---

## 4. Earnings Page

A financial ledger page displaying the professional's earnings history.

### 4.1 Summary Metrics

- **Total Earned (All Time)**: Cumulative sum of settled net earnings.
- **This Month**: Earnings generated in the current month.
- **Pending Release**: Earned funds held in escrow until the payout is completed.
- **Platform Fee (All Time)**: Sum of platform commissions (informational).

### 4.2 Earning Entity Schema

Tracks transactions and fees for each booking.

| Field               | Type              | Required | Description                                |
| :------------------ | :---------------- | :------- | :----------------------------------------- |
| `_id`               | ObjectId / String | Yes      | Unique earning ID                          |
| `professionalId`    | ObjectId / String | Yes      | Recipient professional ID                  |
| `bookingId`         | ObjectId / String | No       | Linked booking ID (for slots)              |
| `packetEnrolmentId` | ObjectId / String | No       | Linked enrollment ID (for packets)         |
| `grossAmount`       | Number            | Yes      | Total customer payment in INR              |
| `platformFee`       | Number            | Yes      | Kridaz commission                          |
| `netAmount`         | Number            | Yes      | Net payout (`grossAmount` - `platformFee`) |
| `status`            | Enum              | Yes      | `pending` or `settled`                     |
| `payoutId`          | ObjectId / String | No       | Reference to payout transfer               |

---

## 5. Payouts Page

Displays details of all bank transfers from the platform to the professional's account. This page is read-only for partners; transfers are triggered by admins.

### 5.1 Payout Entity Schema

Tracks disbursement batches sent to the professional's bank account.

| Field            | Type              | Required | Description                                    |
| :--------------- | :---------------- | :------- | :--------------------------------------------- |
| `_id`            | ObjectId / String | Yes      | Unique payout ID                               |
| `professionalId` | ObjectId / String | Yes      | Recipient professional ID                      |
| `amount`         | Number            | Yes      | Disbursed amount in INR                        |
| `earningIds`     | Array of String   | Yes      | List of settled earnings in this batch         |
| `bankAccount`    | String            | Yes      | Masked bank account number (e.g. `******8890`) |
| `status`         | Enum              | Yes      | `pending`, `processing`, `paid`, `failed`      |
| `initiatedBy`    | ObjectId / String | Yes      | ID of the admin who approved                   |
| `initiatedAt`    | Date              | Yes      | Payout approval timestamp                      |
| `paidAt`         | Date              | No       | Bank settlement confirmation timestamp         |
| `failureReason`  | String            | No       | Error logs in case of transaction failure      |
| `transactionRef` | String            | No       | Bank reference ID                              |

---

## 6. Feedback Page

Consolidates customer feedback and reviews. It is divided into two tabs: **Reviews** and **Requests**.

### 6A. Reviews

Displays ratings and reviews left by customers after completed sessions.

#### 6A.1 Review Schema

Stores customer ratings.

| Field                | Type              | Required | Description                                            |
| :------------------- | :---------------- | :------- | :----------------------------------------------------- |
| `_id`                | ObjectId / String | Yes      | Unique review ID                                       |
| `reviewedEntity`     | ObjectId / String | Yes      | Reviewed professional ID                               |
| `reviewedEntityType` | Enum              | Yes      | `coach`, `umpire`, `scorer`, `commentator`, `streamer` |
| `reviewerId`         | ObjectId / String | Yes      | ID of the reviewing user                               |
| `bookingId`          | ObjectId / String | Yes      | Associated completed booking ID                        |
| `rating`             | Number            | Yes      | Rating score (1–5)                                     |
| `comment`            | String            | No       | Review text                                            |
| `reply`              | String            | No       | Professional's response                                |
| `repliedAt`          | Date              | No       | Response timestamp                                     |
| `isVisible`          | Boolean           | Yes      | Flag to show/hide review                               |

#### 6A.2 Interactivity Rules

- **Validation**: Reviews can only be left for completed bookings.
- **Professional Reply**: Professionals can reply to reviews inline, which is saved to `reply` and `repliedAt`.

---

### 6B. Requests

Tracks custom booking inquiries sent by users (e.g., asking for custom slots or discussing tournament requirements).

#### 6B.1 BookingRequest Schema

Stores custom inquiries.

| Field                | Type              | Required | Description                                   |
| :------------------- | :---------------- | :------- | :-------------------------------------------- |
| `_id`                | ObjectId / String | Yes      | Unique request ID                             |
| `professionalId`     | ObjectId / String | Yes      | Recipient professional ID                     |
| `userId`             | ObjectId / String | Yes      | ID of the requesting user                     |
| `sport`              | String            | Yes      | Target sport                                  |
| `preferredDates`     | Array of Date     | Yes      | Proposed dates                                |
| `preferredTimeSlot`  | String            | No       | Proposed time window (e.g., "16:00-18:00")    |
| `message`            | String            | Yes      | Inquiry message                               |
| `status`             | Enum              | Yes      | `pending`, `accepted`, `declined`, `expired`  |
| `declineReason`      | String            | No       | Reason if declined                            |
| `convertedBookingId` | ObjectId / String | No       | Associated booking ID if accepted             |
| `expiresAt`          | Date              | Yes      | Expiration timestamp (48 hours from creation) |

#### 6B.2 Actions on Pending Requests

- **Accept**: Creates a `Booking` document in `pending` payment status, links it, and sends the user a payment checkout link.
- **Decline**: Rejects the request, requiring the professional to specify a reason.
- **Expire**: Requests not acted upon within 48 hours are automatically marked `expired` by a system cron job.

---

## 7. Role-Based Feature Matrix

| Feature               | Coach | Umpire | Scorer | Commentator | Streamer | Notes                                  |
| :-------------------- | :---: | :----: | :----: | :---------: | :------: | :------------------------------------- |
| **Overview Page**     |   ✓   |   ✓    |   ✓    |      ✓      |    ✓     | Identical layout for all roles.        |
| **Slot Management**   |   ✓   |   ✓    |   ✓    |      ✓      |    ✓     | Calendar slot management.              |
| **Packet Management** |   ✓   |   ✗    |   ✗    |      ✗      |    ✗     | Coaches only.                          |
| **Customers List**    |   ✓   |   ✓    |   ✓    |      ✓      |    ✓     | Packet columns hidden for non-coaches. |
| **Earnings Page**     |   ✓   |   ✓    |   ✓    |      ✓      |    ✓     | Packet items hidden for non-coaches.   |
| **Payouts Page**      |   ✓   |   ✓    |   ✓    |      ✓      |    ✓     | Read-only payout records.              |
| **Reviews & Ratings** |   ✓   |   ✓    |   ✓    |      ✓      |    ✓     | Completed bookings only.               |
| **Custom Requests**   |   ✓   |   ✓    |   ✓    |      ✓      |    ✓     | Multi-day scheduling requests.         |

---

## 8. Technical Code Implementation

The following sections contain the database schemas, API routes, and controller code for the professional profile features, mapped to the project's actual **PostgreSQL & Prisma** architecture.

### 8.1 Database Modeling (Prisma Schemas)

```prisma
// Add these models to server/prisma/schema.prisma

model BookingSlot {
  id             String         @id @default(uuid())
  professionalId String
  slotDate       DateTime
  startTime      String         // Format: "HH:MM"
  endTime        String         // Format: "HH:MM"
  sport          String
  isRecurring    Boolean        @default(false)
  recurringDay   String?        // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  status         SlotStatus     @default(OPEN)
  bookingId      String?        @unique
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  // Relations
  professional   OwnerProfile   @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  booking        Booking?       @relation("BookingToSlot", fields: [bookingId], references: [id])

  @@index([professionalId, slotDate])
  @@index([status])
}

enum SlotStatus {
  OPEN
  BOOKED
  BLOCKED
  CANCELLED
}

model CoachPacket {
  id            String             @id @default(uuid())
  coachId       String
  title         String
  sport         String
  totalSessions Int
  durationDays  Int
  sessionDays   String[]           // Days of week e.g. ["Mon", "Wed"]
  sessionTime   String             // Format: "HH:MM"
  price         Decimal            @db.Decimal(10, 2)
  maxStudents   Int
  description   String?            @db.Text
  isActive      Boolean            @default(true)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  // Relations
  coach         OwnerProfile       @relation(fields: [coachId], references: [id], onDelete: Cascade)
  enrolments    PacketEnrolment[]

  @@index([coachId, isActive])
}

model PacketEnrolment {
  id                String       @id @default(uuid())
  packetId          String
  userId            String
  coachId           String
  sessionsAttended  Int          @default(0)
  status            EnrolmentStatus @default(ACTIVE)
  razorpayOrderId   String       @unique
  razorpayPaymentId String?
  amountPaid        Decimal      @db.Decimal(10, 2)
  purchasedAt       DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // Relations
  packet            CoachPacket  @relation(fields: [packetId], references: [id])
  user              User         @relation(fields: [userId], references: [id])
  coach             OwnerProfile @relation(fields: [coachId], references: [id])
  earnings          Earning[]

  @@index([packetId])
  @@index([userId])
  @@index([coachId])
}

enum EnrolmentStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

model Earning {
  id                 String           @id @default(uuid())
  professionalId     String
  bookingId          String?          @unique
  packetEnrolmentId  String?
  grossAmount        Decimal          @db.Decimal(10, 2)
  platformFee        Decimal          @db.Decimal(10, 2)
  netAmount          Decimal          @db.Decimal(10, 2)
  status             EarningStatus    @default(PENDING)
  payoutId           String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  // Relations
  professional       OwnerProfile     @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  booking            Booking?         @relation(fields: [bookingId], references: [id])
  packetEnrolment    PacketEnrolment? @relation(fields: [packetEnrolmentId], references: [id])
  payout             Payout?          @relation(fields: [payoutId], references: [id])

  @@index([professionalId, status])
  @@index([createdAt])
}

enum EarningStatus {
  PENDING
  SETTLED
}

model Payout {
  id             String        @id @default(uuid())
  professionalId String
  amount         Decimal       @db.Decimal(12, 2)
  bankAccount    String        // Masked: e.g. "******4321"
  status         PayoutStatus  @default(PENDING)
  initiatedById  String
  initiatedAt    DateTime      @default(now())
  paidAt         DateTime?
  failureReason  String?       @db.Text
  transactionRef String?

  // Relations
  professional   OwnerProfile  @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  initiatedBy    User          @relation("AdminInitiatedPayout", fields: [initiatedById], references: [id])
  earnings       Earning[]

  @@index([professionalId])
  @@index([status])
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}

model BookingRequest {
  id                 String               @id @default(uuid())
  professionalId     String
  userId             String
  sport              String
  preferredDates     DateTime[]
  preferredTimeSlot  String?              // e.g. "17:00-19:00"
  message            String               @db.Text
  status             RequestStatus        @default(PENDING)
  declineReason      String?              @db.Text
  convertedBookingId String?              @unique
  expiresAt          DateTime
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  // Relations
  professional       OwnerProfile         @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  user               User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  convertedBooking   Booking?             @relation("BookingFromRequest", fields: [convertedBookingId], references: [id])

  @@index([professionalId, status])
  @@index([expiresAt])
}

enum RequestStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}
```

### 8.2 API Routing Configurations

```javascript
// server/modules/professional/professional.routes.js
import express from "express";
import {
  getOverviewData,
  configureAvailability,
  handleBookingRequest,
} from "./professional.controller.js";
import { authenticateUser, checkPartnerRole } from "../../middlewares/auth.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/overview", checkPartnerRole, getOverviewData);
router.post("/slots/configure", checkPartnerRole, configureAvailability);
router.post(
  "/requests/:requestId/action",
  checkPartnerRole,
  handleBookingRequest
);

export default router;
```

### 8.3 Core Controller Logics

#### Overview Page Aggregator

```javascript
// server/modules/professional/professional.controller.js
import { prisma } from "../../config/db.js";

export const getOverviewData = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const profile = await prisma.ownerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return res
        .status(404)
        .json({ message: "Professional profile not found" });
    }

    const professionalId = profile.id;

    const [
      totalBookingsCount,
      upcomingSessions,
      totalEarningsAggregation,
      averageRatingAggregation,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: { professionalId, status: "CONFIRMED" },
      }),
      prisma.booking.count({
        where: {
          professionalId,
          status: "CONFIRMED",
          playStartTime: { gte: new Date() },
        },
      }),
      prisma.earning.aggregate({
        where: { professionalId, status: "SETTLED" },
        _sum: { netAmount: true },
      }),
      prisma.review.aggregate({
        where: { professionalId },
        _avg: { rating: true },
      }),
      prisma.booking.findMany({
        where: { professionalId },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          playStartTime: true,
          sport: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      kpis: {
        totalBookings: totalBookingsCount,
        upcomingSessions,
        totalEarnings: totalEarningsAggregation._sum.netAmount || 0,
        averageRating: averageRatingAggregation._avg.rating || 0,
      },
      recentBookings,
    });
  } catch (error) {
    console.error("Overview fetch failure:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
```

#### Booking Requests (Accept / Decline Transactions)

```javascript
export const handleBookingRequest = async (req, res) => {
  const { id: userId } = req.user;
  const { requestId } = req.params;
  const { action, declineReason } = req.body;

  try {
    const profile = await prisma.ownerProfile.findUnique({
      where: { userId },
    });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const request = await prisma.bookingRequest.findFirst({
      where: { id: requestId, professionalId: profile.id },
    });

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: `Request is already resolved: ${request.status}` });
    }

    if (action === "accept") {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            userId: request.userId,
            turfId: "",
            totalPrice: 0.0,
            paidAmount: 0.0,
            balanceAmount: 0.0,
            status: "PENDING",
            bookingSource: "REQUEST",
          },
        });

        const updatedRequest = await tx.bookingRequest.update({
          where: { id: requestId },
          data: {
            status: "ACCEPTED",
            convertedBookingId: booking.id,
          },
        });

        return { booking, updatedRequest };
      });

      return res.status(200).json({
        success: true,
        message:
          "Request accepted. Order initialized for user payment checkout.",
        data: result,
      });
    }

    if (action === "decline") {
      const updatedRequest = await prisma.bookingRequest.update({
        where: { id: requestId },
        data: {
          status: "DECLINED",
          declineReason: declineReason || "Declined by professional",
        },
      });

      return res.status(200).json({
        success: true,
        message: "Request declined successfully.",
        data: updatedRequest,
      });
    }

    return res.status(400).json({ message: "Invalid action parameter" });
  } catch (error) {
    console.error("Request process error:", error);
    return res.status(500).json({ message: "Database transaction failed" });
  }
};
```
