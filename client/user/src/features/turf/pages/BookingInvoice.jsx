import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Download, Loader2, ShieldCheck } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";

const BookingInvoice = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    const fetchBookingAndInvoice = async () => {
      try {
        const [bookingRes, invoiceRes] = await Promise.all([
          axiosInstance.get(`/api/user/booking/${id}`),
          axiosInstance.get(`/api/user/booking/invoice/${id}`, { responseType: 'blob' })
        ]);
        setBooking(bookingRes.data);
        objectUrl = URL.createObjectURL(invoiceRes.data);
        setPdfUrl(objectUrl);
      } catch (err) {
        console.error("Error fetching invoice data:", err);
        setError(
          err.response?.data?.message || "Failed to load invoice details"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBookingAndInvoice();
    
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
          Preparing your invoice...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
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
    <div className="min-h-screen bg-background py-6 flex flex-col font-sans">
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
            href={pdfUrl || "#"}
            download={`Kridaz_Invoice_${booking?.orderId || id}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-[#b8e600] rounded-[8px] px-4 py-2 text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(204,255,0,0.1)]"
          >
            <Download size={14} />
            Download
          </a>
        </div>

        {/* Invoice PDF Viewer */}
        <div className="bg-white flex-1 w-full relative">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0 absolute inset-0"
              title={`Invoice ${id}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              <Loader2 size={24} className="animate-spin mr-2" />
              Loading PDF...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingInvoice;
