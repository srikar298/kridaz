# Wallet Module

## Overview

The Wallet module handles user balances, transaction history, and Razorpay-integrated top-ups.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (currently only `user`).
- `wallet.controller.js`: Logic for balance management and payment verification.
- `wallet.validator.js`: Schemas for top-up creation and verification.

## API Endpoints

Mounted at `/api/wallet` (and accessible via `/api/user/wallet` for legacy compatibility).

### User Actions

- `GET /data`: Retrieve current balance and recent transaction history.
- `POST /topup/create-order`: Initiate a Razorpay order for fund addition.
- `POST /topup/verify`: Confirm payment and credit funds to the wallet.
- `GET /topup/check-status/:orderId`: Poll for payment status updates.

## Security & Rate Limiting

- **Auth**: All wallet actions require `userAuth`.
- **Throttling**: `paymentLimiter` is applied to order creation and verification to prevent abuse and double-spend attempts.
