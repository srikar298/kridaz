import Razorpay from "razorpay";
import dotenv from "dotenv";
import { createCircuitBreaker } from "../utils/circuitBreaker.js";
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykeyid123",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummysecret123456",
});

/**
 * Circuit-broken wrapper around razorpay.orders.create().
 * If Razorpay is down, this fails fast instead of hanging for 30+ seconds.
 */
const _createOrder = (options) => razorpay.orders.create(options);
export const createOrder = createCircuitBreaker(_createOrder, {
  name: "Razorpay_CreateOrder",
  timeout: 15_000,
});

export default razorpay;
