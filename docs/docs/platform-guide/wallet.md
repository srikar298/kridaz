# Wallet System

The **Digital Wallet** is a core component of the Kridaz financial ecosystem. It enables frictionless, instant bookings by allowing users to preload coins and utilize them seamlessly during checkout.

![Wallet Mockup](/img/platform/wallet_mockup.png)

## UI Overview

The Wallet Page (`client/user/src/features/wallet/pages/Wallet.jsx`) provides a comprehensive view of the user's financial standing within the platform.

### Key Elements

1. **Balance Card (Glassmorphism UI):**
   Displays the user's coins with a premium glassmorphism gradient (cyan to neon yellow). It clearly breaks down the balance into:
   - **Total:** Overall coin count.
   - **Reserved:** Coins temporarily locked during an active checkout session.
   - **Available (Usable):** Coins ready for immediate spending.

2. **Top-up Section:**
   A streamlined interface for purchasing coins. It includes preset quick-add buttons (`+500`, `+1000`, `+2000`) and a custom input field.

3. **Transaction History:**
   A chronological list of all financial activities, including top-ups (additions) and turf bookings (deductions). Each entry displays the transaction type, date, amount, and status (`SUCCESS`, `PENDING`, `FAILED`).

## Implementation Details

The wallet is deeply integrated with **Razorpay** for secure payment processing and relies on Redux to synchronize the balance globally across the app.

### Top-up Flow & Razorpay Integration

When a user initiates a top-up, the system follows a robust 3-step sequence:

1. **Order Creation:** The frontend requests a new Razorpay order ID from the backend.
2. **Payment Gateway Launch:** The Razorpay checkout modal is invoked using the generated order ID.
3. **Verification:** Upon completion, the payment signature is verified by the backend, and the wallet balance is updated.

```javascript
const handleTopup = async () => {
  setIsProcessing(true);
  try {
    // 1. Create Order
    const { data } = await axiosInstance.post(
      "/api/user/wallet/topup/create-order",
      {
        amount: Number(topupAmount),
      }
    );

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.order.amount,
      order_id: data.order.id,
      handler: async (response) => {
        // 3. Verify Payment
        const verifyRes = await axiosInstance.post(
          "/api/user/wallet/topup/verify",
          response
        );
        if (verifyRes.data.success) fetchWalletData(); // Refresh balance
      },
      theme: { color: "#55DEE8" },
    };

    // 2. Open Gateway
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    toast.error("Failed to initiate top-up");
  } finally {
    setIsProcessing(false);
  }
};
```

### State Synchronization

To ensure the balance is consistent across the application (e.g., updating the navbar display immediately after a top-up), the wallet state is dispatched to Redux upon successful API retrieval:

```javascript
const fetchWalletData = async () => {
  const response = await axiosInstance.get("/api/user/wallet/data");
  setBalance(response.data.balance);
  setReservedBalance(response.data.reservedBalance);
  setUsableBalance(response.data.usableBalance);

  // Sync globally
  dispatch(
    updateUser({
      walletBalance: response.data.balance,
      reservedBalance: response.data.reservedBalance,
    })
  );
};
```
