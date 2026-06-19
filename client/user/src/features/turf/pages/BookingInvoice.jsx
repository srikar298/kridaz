import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Download, Loader2, ShieldCheck } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";

const BookingInvoice = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const invoiceDownloadUrl = `${import.meta.env.VITE_API_URL}/api/user/booking/invoice/${id}`;

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axiosInstance.get(`/api/user/booking/${id}`);
        setBooking(response.data);
      } catch (err) {
        console.error("Error fetching invoice data:", err);
        setError(
          err.response?.data?.message || "Failed to load invoice details"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-[#BFF367] animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
          Preparing your invoice...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldCheck size={40} className="text-red-500" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-tight mb-2">
          Access Denied
        </h1>
        <p className="text-zinc-500 text-sm max-w-xs mb-8">
          {error || "Invoice not found"}
        </p>
        <Link
          to="/"
          className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-[8px] text-xs font-bold uppercase tracking-wider transition-all"
        >
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000] py-6 flex flex-col font-sans">
      <div className="w-full flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 px-4">
          <Link
            to={`/booking-pass/${id}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-xs font-bold uppercase tracking-widest">
              Back to Pass
            </span>
          </Link>

          <a
            href={invoiceDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#BFF367] hover:bg-[#b8e600] rounded-[8px] px-4 py-2 text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(204,255,0,0.1)]"
          >
            <Download size={14} />
            Download
          </a>
        </div>

        {/* Invoice PDF Viewer */}
        <div className="bg-white flex-1 w-full relative">
          <object
            data={invoiceDownloadUrl}
            type="application/pdf"
            className="w-full h-full border-0 absolute inset-0"
            title={`Invoice ${id}`}
          >
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-100">
              <p className="text-gray-600 mb-4 text-sm font-medium">
                Your browser doesn&apos;t support inline PDF viewing.
              </p>
              <a
                href={invoiceDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#BFF367] text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest"
              >
                Download PDF to View
              </a>
            </div>
          </object>
        </div>
      </div>
    </div>
  );
};

export default BookingInvoice;
