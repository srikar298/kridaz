import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "@redux/slices/authSlice";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Enter your email").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Enter a valid email"),
  phone: z.string().min(1, "Enter your phone number").regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number").length(10, "Phone number must be at least 10 digits long"),
  password: z.string().min(1, "Enter your password").min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(1, "Confirm your password"),
  role: z.string().min(1, "Role is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

const usePartnerSignUpForm = (predefinedRole = "venu_owners") => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: predefinedRole,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const payload = { ...data, role: predefinedRole };
    try {
      const response = await axiosInstance.post("/api/owner/auth/register", payload);
      const result = response.data;

      if (predefinedRole === "venu_owners" || predefinedRole === "owner") {
        dispatch(login({ token: result.token, role: result.role }));
        toast.success("Welcome to Kridaz!");
        window.location.href = "/venue-owner";
      } else {
        const waitlistNumber = result.waitlistNumber || Math.floor(Math.random() * 50) + 1;
        toast.success("You're on the waitlist!");
        navigate("/waitlist-success", {
          state: {
            waitlistNumber,
            role: predefinedRole,
            name: data.name,
          },
        });
      }
    } catch (error) {
      if (error.response) {
        toast.error(`${error.response.data.message || "Registration failed"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return { register, handleSubmit, errors, onSubmit, loading, getValues };
};

export default usePartnerSignUpForm;

