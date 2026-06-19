# Ground Details

The **Ground Details** (or Turf Details) page is the primary conversion point for users. It presents comprehensive information about a specific venue and provides the interface for selecting booking slots.

![Ground Mockup](/img/platform/ground_mockup.png)

## UI Architecture

The details page (`client/user/src/features/turf/components/TurfDetails.jsx`) is designed to be highly immersive and informative, ensuring users have all the necessary context before booking.

### Core Components

1. **High-Fidelity Image Gallery:**
   A large hero image with a scrollable thumbnail carousel beneath it. This allows users to inspect the turf quality, lighting, and general environment.
2. **Venue Metadata:**
   Displays the turf name, physical address, average star rating, total review count, and the base price per hour.
3. **Amenities List:**
   A clean grid showcasing available facilities using checkmarks (e.g., Free Parking, Floodlights, Change Room, Drinking Water).

4. **Dynamic Slot Picker:**
   The most complex component on the page. It consists of:
   - **Date Carousel:** A horizontally scrolling list of dates.
   - **Duration Toggles:** Options to select booking length (e.g., 60 min, 90 min, 120 min).
   - **Time Slot Grid:** Available slots outlined in a dark borders, while selected slots are highlighted in a vibrant cyan-to-lime gradient (`#55DEE8` to `#BFF367`) and booked or past slots are grayed out.

## Code Implementation

The page relies on specialized hooks like `useTurfDetails` and `useTimeSelection` to handle the intricate logic of slot availability.

### Fetching Venue Data

Data is fetched based on the URL parameter (`id`) and is cached or retrieved fresh depending on the application state.

```javascript
useEffect(() => {
  const fetchTurfDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/user/turfs/${id}`);
      setTurf(response.data.turf);
    } catch (error) {
      console.error("Failed to load turf details");
    } finally {
      setLoading(false);
    }
  };

  if (id) fetchTurfDetails();
}, [id]);
```

### Slot Generation & Validation

The application does not hardcode time slots. Instead, it generates them dynamically based on the turf's operational hours and the selected duration. The logic checks for overlaps with existing bookings to determine slot states (`AVAILABLE`, `BOOKED`, `PAST`).

```javascript
// Conceptual representation of slot logic
const generateSlots = (
  openTime,
  closeTime,
  durationMinutes,
  existingBookings
) => {
  const slots = [];
  let currentTime = parseTime(openTime);
  const endLimit = parseTime(closeTime);

  while (currentTime + durationMinutes <= endLimit) {
    const isBooked = checkOverlap(
      currentTime,
      durationMinutes,
      existingBookings
    );
    slots.push({
      time: formatTime(currentTime),
      status: isBooked ? "BOOKED" : "AVAILABLE",
    });
    currentTime += 30; // 30-minute stepping
  }
  return slots;
};
```

### UX Considerations

- **Instant Price Calculation:** As the user changes the duration or selects premium time slots, the "Total Price" updates instantaneously.
- **Sticky Booking Bar:** On mobile devices, the "Book Now" button remains fixed at the bottom of the screen, ensuring the primary call-to-action is always accessible.
