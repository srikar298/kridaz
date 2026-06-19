---
sidebar_position: 11
title: Admin Account Recovery
---

# Kridaz Admin Account Recovery Procedures

**STATUS: CONFIDENTIAL & RESTRICTED**

Due to recent security hardening, all authentication bypass mechanisms have been permanently removed from the source code. All admin accounts are subject to mandatory Two-Factor Authentication (2FA) via Email and/or WhatsApp.

This document outlines the standard operating procedure for recovering a compromised or inaccessible Super Admin account.

## Prohibited Actions

- **NEVER** modify `server/modules/auth/auth.controller.js` to bypass OTP for admin roles. This is considered a critical security violation.
- **NEVER** hardcode access tokens in the source code.

## Recovery Procedure (Direct DB Modification)

If an admin loses access to their registered email and phone number, another Super Admin or the Database Administrator must perform the following actions directly within the production PostgreSQL instance.

### Prerequisites

- Access to the Kridaz PostgreSQL Production Database.
- Database Administrative credentials.

### Steps

1. Connect to the production database using pgAdmin, DBeaver, or the PostgreSQL command-line shell (`psql`).
2. Select the database and query the users/owners table.
3. Locate the locked admin account. You can query by their known username or legacy email:
   ```sql
   SELECT id, name, email, phone, role FROM "User" WHERE role = 'BMSP_SUPER_ADMIN' AND name = 'Target Admin Name';
   ```
4. Verify the identity of the person requesting the recovery out-of-band (e.g., via a live video call or internal HR verification).
5. Update the email and/or phone fields to the admin's new, secure contact details:
   ```sql
   UPDATE "User"
   SET email = 'new.secure.email@kridaz.com', phone = '919876543210'
   WHERE id = 'ADMIN_UUID';
   ```
6. The admin can now initiate a standard login on the Kridaz dashboard. The system will dispatch the 2FA OTP to the newly configured email and WhatsApp number.
7. Document this recovery event in the internal security audit log.
