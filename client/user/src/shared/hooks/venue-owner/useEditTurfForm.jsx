import React, { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";

export const useEditTurfForm = (initialValues) => {
  const validationSchema = z
    .object({
      name: z.string().min(1, "Turf name is required"),
      description: z.string().min(1, "Description is required"),
      pricePerHour: z
        .number({ invalid_type_error: "Price per hour is required" })
        .positive("Price per hour must be a positive number"),
      location: z.string().min(1, "Location is required"),
      sportsType: z.string().min(1, "Sports type is required"),
      openTime: z.string().min(1, "Open time is required"),
      closeTime: z.string().min(1, "Close time is required"),
    })
    .refine(
      (data) => {
        return (
          new Date(`1970-01-01 ${data.closeTime}`) >
          new Date(`1970-01-01 ${data.openTime}`)
        );
      },
      {
        message: "Close time must be after open time",
        path: ["closeTime"],
      }
    );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...initialValues,
      openTime: initialValues?.openTime
        ? format(parse(initialValues.openTime, "HH:mm", new Date()), "hh:mm a")
        : "",
      closeTime: initialValues?.closeTime
        ? format(parse(initialValues.closeTime, "HH:mm", new Date()), "hh:mm a")
        : "",
    },
  });

  const onSubmit = (data) => {
    return {
      ...data,
      openTime: data.openTime,
      closeTime: data.closeTime,
    };
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    reset,
    setValue,
  };
};

export default useEditTurfForm;
