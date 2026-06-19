# Backend Security & Protection

Kridaz uses a multi-layered security model to protect user data and ensure platform stability.

## 1. Authentication (JWT)

We use JSON Web Tokens (JWT) with an **Access Token + Refresh Token** strategy.

- **Access Tokens**: Short-lived (e.g., 1 hour), stored in memory or cookies.
- **Refresh Tokens**: Long-lived, stored in HTTP-only cookies, used to issue new access tokens.

### Middleware

- `verifyToken`: Generic user authentication.
- `verifyOwnerToken`: Strict turf owner authentication.
- `verifyAdminToken`: Super Admin only access.

## 2. Rate Limiting (Redis-Backed)

To prevent brute force and DDoS attacks, we apply rate limits at the route level.

| Limiter          | Purpose                             | Typical Limit          |
| :--------------- | :---------------------------------- | :--------------------- |
| `globalLimiter`  | Applied to all `/api` routes        | 500 requests / 15 mins |
| `authLimiter`    | Login, Register, Password Reset     | 5 requests / 15 mins   |
| `otpLimiter`     | Sending/Verifying OTPs              | 3 requests / 5 mins    |
| `paymentLimiter` | Creating orders, verifying payments | 10 requests / hour     |

### How to use

Apply the limiter directly in your module's route file:

```javascript
import { paymentLimiter } from "../../middleware/rateLimiter.middleware.js";

router.post("/topup", paymentLimiter, controller.topup);
```

## 3. Bot Protection (Cloudflare Turnstile)

Critical routes (Login, Register, OTP) are gated by **Cloudflare Turnstile**.

- The frontend must send a `cf-turnstile-response` token.
- The backend validates this via `validateTurnstile` middleware before processing the request.

## 4. Input Validation (Zod)

Every request must be validated against a schema before reaching the controller.

- **Location**: `server/modules/<module>/<module>.validator.js`
- **Enforcement**: Via the `validate()` middleware.

## 5. Security Best Practices

1. **Never use `req.body.userId`**: Always use `req.user.id` (populated by auth middleware).
2. **SQL Injection**: Use Prisma's parameter binding (automatic). Avoid raw queries.
3. **Sensitive Data**: Never return passwords or salt in API responses.
4. **CORS**: Configured in `app.js` to allow only trusted domains.
