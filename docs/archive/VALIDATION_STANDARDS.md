# Kridaz Input Validation Standards

## Overview

All input validation in the Kridaz platform is standardized using **Zod**. This ensures type safety, consistency, and robust security across all modules.

## Key Principles

1. **Zod Only**: No `express-validator` or manual `if (!body.field)` checks in controllers.
2. **Standard Middleware**: Use the `validate()` middleware wrapper from `server/middleware/validate.middleware.js`.
3. **HTTP 422**: Failed validations MUST return a `422 Unprocessable Entity` status code.
4. **Error Schema**: Validation errors must follow the format:
   ```json
   {
     "success": false,
     "message": "Validation failed",
     "errors": [{ "field": "email", "message": "Invalid email format" }]
   }
   ```

## Regex Standards

- **Phone**: `^[0-9]{10}$` (Strict 10-digit)
- **Email**: Standard `z.string().email()`
- **Password**: `min(6)` (Base requirement)

## Implementation Guide

### 1. Define Schemas in `@kridaz/common`

All Zod schemas should be defined in `packages/common/src/schemas/*.ts`. This ensures they are available to both the server and the frontend.

```typescript
// packages/common/src/schemas/user.schema.ts
import { z } from "zod";
export const userSchema = z.object({
  body: z.object({ ... })
});
export type UserInput = z.infer<typeof userSchema>;
```

### 2. Export from `@kridaz/common/src/index.ts`

```typescript
export * from "./schemas/user.schema.js";
```

### 3. Re-export in Module Validator (Server)

Create `xxx.validator.js` in your server module directory and re-export the relevant schemas.

```javascript
import { userSchema } from "@kridaz/common";
export { userSchema };
```

### 4. Apply to Routes

```javascript
import { validate } from "../../middleware/validate.middleware.js";
import { userSchema } from "./user.validator.js";

router.post("/route", validate(userSchema), controller.handler);
```

### 5. Use in Frontend (Sync)

The frontend can import both the schema (for validation) and the type (for state/props).

```javascript
import { userSchema } from "@kridaz/common";
import type { UserInput } from "@kridaz/common";
```

## Maintenance

Periodically run the validation test suite to ensure all schemas are functioning as expected:
`npm test server/tests/validation.test.js`
