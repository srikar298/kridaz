# Bookings Management

The **Bookings Management** system is divided into two primary experiences: the **User Booking Pass** and the **Venue Owner Dashboard**. Together, they provide a seamless end-to-end reservation ecosystem.

![Bookings Mockup](/img/platform/bookings_mockup.png)

## User Experience: Booking Pass

When a user successfully reserves a turf, they are issued a digital **Booking Pass**.

### Key Features

- **Scannable QR Code:** For quick check-ins at the venue.
- **Game Details:** Displays the sport, time, duration, and specific pitch/court.
- **Status Tracking:** Visual indicators for upcoming, completed, or cancelled bookings.

### Implementation

The Booking Pass (`client/user/src/features/turf/components/BookingPass.jsx`) fetches the reservation details and presents them using a high-fidelity ticket design.

```javascript
// Example data structure consumed by BookingPass
const passDetails = {
  bookingId: "SP-CRK87321",
  turfName: "Olympia Arena (Pitch 1)",
  sport: "CRICKET",
  date: "Oct 27, 2023",
  time: "6:00 PM - 8:00 PM",
  status: "CONFIRMED",
};
```

## Venue Owner Experience: Schedule Management

Venue Owners have access to a dedicated dashboard (`OwnerBookings.jsx` and `OwnerCalendar.jsx`) to manage their inventory.

### Key Features

- **Visual Calendar Schedule:** A time-grid view showing occupied and free slots across different days and pitches.
- **Quick Statistics:** Real-time metrics on total bookings, active sessions, and slot utilization percentages.
- **Manual Adjustments:** Owners can manually block slots for maintenance or offline bookings.

### Implementation

The owner dashboard utilizes a robust hook (`useOwnerBookings.jsx`) to sync data with the backend in real-time.

```javascript
// Fetching active schedules
const fetchSchedules = async () => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(
      `/api/owner/bookings/schedule?date=${selectedDate}`
    );
    setSlots(response.data.slots);
    setStatistics(response.data.stats);
  } catch (error) {
    toast.error("Failed to sync schedules");
  } finally {
    setLoading(false);
  }
};
```

The UI employs CSS Grid to render the overlapping time blocks, providing a highly intuitive visual representation of the day's activity. Glassmorphism overlays and dynamic coloring (e.g., green for free, purple/blue for occupied) ensure clarity even during peak hours.
