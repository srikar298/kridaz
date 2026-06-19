import express from "express";
import {
  createInquiry,
  getProInquiries,
  updateInquiryStatus,
  checkRecentInquiry,
} from "../inquiry.controller.js";
import {
  getAllProfessionals,
  getProfessionalFilters,
  getProfessionalById,
  bookProfessional,
  updateAvailability,
  getMyBookings,
  handleBookingRequest,
  addProfessionalReview,
  replyToReview,
  updateProfessionalProfile,
  getMyProfessionalProfile,
  getProfessionalTasks,
  createProfessionalTask,
  getProfessionalCustomers,
  createProfessionalCustomer,
  updateWorkingHours,
  getUserProfessionalBookings,
  toggleOnlineStatus,
  createMatchRequest,
  acceptMatchOffer,
  rejectMatchOffer,
  verifyOTPCheckIn,
  completeProfessionalBooking,
  getMyOnDemandBookings,
  getUserOnDemandBookings,
  getDashboardStats,
  getTrustScoreHistory,
} from "../professional.controller.js";
import protect, {
  optionalAuth,
} from "../../../middleware/jwt/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Professional
 *   description: Booking Umpires, Scorers, Streamers, and Coaches
 */

// User Routes

/**
 * @swagger
 * /professional/list:
 *   get:
 *     summary: List all professional services
 *     description: Returns a paginated list of professionals (umpires, scorers, etc).
 *     tags: [Professional]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [UMPIRE, SCORER, STREAMER, COACH] }
 *     responses:
 *       200:
 *         description: List of professionals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Professional' }
 */
router.get("/list", getAllProfessionals);

/**
 * @swagger
 * /professional/filters:
 *   get:
 *     summary: Get professional search filters
 *     description: Returns categories, locations, and experience ranges for filtering.
 *     tags: [Professional]
 *     responses:
 *       200:
 *         description: Filter options
 */
router.get("/filters", getProfessionalFilters);

/**
 * @swagger
 * /professional/details/{id}:
 *   get:
 *     summary: Get professional details
 *     tags: [Professional]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Professional details
 */
router.get("/details/:id", optionalAuth, getProfessionalById);

/**
 * @swagger
 * /professional/book:
 *   post:
 *     summary: Book a professional
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [professionalId, date, time]
 *             properties:
 *               professionalId: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string }
 *     responses:
 *       200:
 *         description: Booking request sent
 */
router.post("/book", protect, bookProfessional);
router.get("/user-bookings", protect, getUserProfessionalBookings);

/**
 * @swagger
 * /professional/review:
 *   post:
 *     summary: Add professional review
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [professionalId, rating, content]
 *             properties:
 *               professionalId: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Review added
 */
router.post("/review", protect, addProfessionalReview);

// Professional (Owner) Routes

/**
 * @swagger
 * /professional/availability:
 *   put:
 *     summary: Update professional availability
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Availability updated
 */
router.put("/availability", protect, updateAvailability);

/**
 * @swagger
 * /professional/my-bookings:
 *   get:
 *     summary: Get professional's bookings
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get("/my-bookings", protect, getMyBookings);

/**
 * @swagger
 * /professional/handle-request:
 *   post:
 *     summary: Handle booking request
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request handled
 */
router.post("/handle-request", protect, handleBookingRequest);

/**
 * @swagger
 * /professional/review/reply:
 *   post:
 *     summary: Reply to a review
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reply recorded
 */
router.post("/review/reply", protect, replyToReview);

/**
 * @swagger
 * /professional/update-profile:
 *   put:
 *     summary: Update professional profile
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/update-profile", protect, updateProfessionalProfile);
router.get("/profile", protect, getMyProfessionalProfile);

/**
 * @swagger
 * /professional/tasks:
 *   get:
 *     summary: Get professional tasks for calendar
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get("/tasks", protect, getProfessionalTasks);

/**
 * @swagger
 * /professional/tasks:
 *   post:
 *     summary: Create professional task
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Task created
 */
router.post("/tasks", protect, createProfessionalTask);

/**
 * @swagger
 * /professional/customers:
 *   get:
 *     summary: Get professional's customers
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get("/customers", protect, getProfessionalCustomers);

/**
 * @swagger
 * /professional/customers:
 *   post:
 *     summary: Add manual customer
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Customer created
 */
router.post("/customers", protect, createProfessionalCustomer);

/**
 * @swagger
 * /professional/working-hours:
 *   put:
 *     summary: Update professional working hours
 *     tags: [Professional]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Working hours updated
 */
router.put("/working-hours", protect, updateWorkingHours);

// On-Demand Matching Routes
router.put("/toggle-online", protect, toggleOnlineStatus);
router.post("/match-request", protect, createMatchRequest);
router.post("/offers/:offerId/accept", protect, acceptMatchOffer);
router.post("/offers/:offerId/reject", protect, rejectMatchOffer);
router.post("/bookings/:bookingId/verify-otp", protect, verifyOTPCheckIn);
router.post(
  "/bookings/:bookingId/complete",
  protect,
  completeProfessionalBooking
);
router.get("/on-demand-bookings", protect, getMyOnDemandBookings);
router.get("/user-on-demand-bookings", protect, getUserOnDemandBookings);
router.get("/dashboard-stats", protect, getDashboardStats);
router.get("/trust-score-history", protect, getTrustScoreHistory);

// Inquiries Routes
router.post("/inquiries", protect, createInquiry);
router.get("/inquiries/pro", protect, getProInquiries);
router.get("/inquiries/check/:proId", protect, checkRecentInquiry);
router.patch("/inquiries/:id", protect, updateInquiryStatus);

export default router;
