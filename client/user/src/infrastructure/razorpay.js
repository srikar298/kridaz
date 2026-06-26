import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";

export const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const createOrder = async (payload) => {
  const response = await axiosInstance.post("/api/user/booking/create-order", payload);
  return response.data;
};

export const handlePayment = async (order, user) => {
  const isLoaded = await loadRazorpay();
  if (!isLoaded) {
    toast.error("Razorpay SDK failed to load. Check your internet connection.");
    return;
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "Kridaz",
      description: "Book a spot for your next adventure",
      handler: function (response) {
        resolve(response);
      },
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      theme: {
        color: "#BFF367",
      },
      modal: {
        ondismiss: function () {
          reject(new Error("Payment cancelled by user."));
        },
      },
    };
    const rzp1 = new window.Razorpay(options);

    rzp1.on("payment.failed", function (response) {
      toast.error(response.error.description || "Payment failed");
      reject(response.error);
    });

    rzp1.open();
  });
};
