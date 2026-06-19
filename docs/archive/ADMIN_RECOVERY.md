# Kridaz Admin Account Recovery Procedures

**STATUS: CONFIDENTIAL & RESTRICTED**

Due to recent security hardening, all authentication bypass mechanisms have been permanently removed from the source code. All admin accounts are subject to mandatory Two-Factor Authentication (2FA) via Email and/or WhatsApp.

This document outlines the standard operating procedure for recovering a compromised or inaccessible Super Admin account.

## Prohibited Actions

- **NEVER** modify `server/modules/auth/auth.controller.js` to bypass OTP for admin roles. This is considered a critical security violation.
- **NEVER** hardcode access tokens in the source code.

## Recovery Procedure (Direct DB Modification)

If an admin loses access to their registered email and phone number, another Super Admin or the Database Administrator must perform the following actions directly within the production MongoDB instance.

### Prerequisites

- Access to the Kridaz MongoDB Production Cluster.
- Database Administrative credentials.

### Steps

1. Connect to the production database using MongoDB Compass or the Mongo Shell (`mongosh`).
2. Select the `kridaz` database and open the `owners` collection.
3. Locate the locked admin account. You can query by their known username or legacy email:
   ```js
   db.owners.findOne({ role: "admin", name: "Target Admin Name" });
   ```
4. Verify the identity of the person requesting the recovery out-of-band (e.g., via a live video call or internal HR verification).
5. Update the `email` and/or `phone` fields to the admin's new, secure contact details:
   ```js
   db.owners.updateOne(
     { _id: ObjectId("ADMIN_OBJECT_ID") },
     { $set: { email: "new.secure.email@kridaz.com", phone: "919876543210" } }
   );
   ```
6. The admin can now initiate a standard login on the Kridaz dashboard. The system will dispatch the 2FA OTP to the newly configured email and WhatsApp number.
7. Document this recovery event in the internal security audit log.
