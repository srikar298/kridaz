import React, { useState } from "react";
import { ArrowRight, User } from "lucide-react";
import { Button, Input } from "@kridaz/ui";

const Step2Organizer = ({ formData, onNext, isLoading }) => {
  const [localData, setLocalData] = useState({
    organizerName: formData.organizerName || "",
    organizerNumber: formData.organizerNumber || "",
    organizerEmail: formData.organizerEmail || "",
    details: {
      ...formData.details,
      contactMethod: formData.details?.contactMethod || "WhatsApp",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({
      ...prev,
      details: { ...prev.details, [name]: value },
    }));
  };

  const setContactMethod = (method) => {
    setLocalData((prev) => ({
      ...prev,
      details: { ...prev.details, contactMethod: method },
    }));
  };

  const submit = () => {
    onNext(localData);
  };

  const isFormValid =
    localData.organizerName.trim() !== "" &&
    localData.organizerNumber.trim() !== "";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-4 bg-secondary rounded-full" />
          Organizer Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 font-bold mb-2 block">
              Organizer Name *
            </label>
            <Input
              type="text"
              name="organizerName"
              value={localData.organizerName}
              onChange={handleChange}
              placeholder="e.g. John Doe, Kridaz Sports..."
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-secondary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 font-bold mb-2 block">
              Contact Number *
            </label>
            <Input
              type="tel"
              name="organizerNumber"
              value={localData.organizerNumber}
              onChange={handleChange}
              placeholder="+91 9999999999"
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-secondary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 font-bold mb-2 block">
              Email Address (Optional)
            </label>
            <Input
              type="email"
              name="organizerEmail"
              value={localData.organizerEmail}
              onChange={handleChange}
              placeholder="organizer@example.com"
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-secondary transition-colors"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-4 bg-primary rounded-full" />
          Preferred Contact Method
        </h2>
        <div className="flex flex-wrap gap-4">
          {["WhatsApp", "Phone Call", "Email", "Kridaz DM"].map((method) => (
            <div
              key={method}
              onClick={() => setContactMethod(method)}
              className={`flex-1 py-3 px-4 rounded-xl border text-center text-sm font-bold cursor-pointer transition-all ${
                localData.details.contactMethod === method
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-card border-white/5 text-white/60 hover:bg-white/5"
              }`}
            >
              {method}
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-end">
          <Button
            onClick={submit}
            disabled={!isFormValid || isLoading}
            className="flex items-center gap-2 bg-primary text-black font-black px-8 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-xs"
          >
            {isLoading ? "Saving..." : "Continue"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step2Organizer;
