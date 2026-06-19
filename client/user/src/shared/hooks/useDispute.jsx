import { useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

export default function useDispute() {
  const [submitting, setSubmitting] = useState(false);

  const raiseDispute = async (formData) => {
    setSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "/api/user/dispute/raise",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data?.success) {
        toast.success("Dispute raised successfully. Our team will review it.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Raise dispute error:", error);
      toast.error(error.response?.data?.message || "Failed to raise dispute");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { raiseDispute, submitting };
}
