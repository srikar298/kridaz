import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Search, Plus, User, Phone, Mail, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfessionalCustomers() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#BFF367" : "#BFF367";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/professional/customers");
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) {
      return toast.error("Name is required");
    }
    try {
      setAdding(true);
      await axiosInstance.post("/api/professional/customers", newCustomer);
      toast.success("Customer added successfully");
      setShowAddModal(false);
      setNewCustomer({ name: "", email: "", phone: "", notes: "" });
      fetchCustomers();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error(error.response?.data?.message || "Failed to add customer");
    } finally {
      setAdding(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  );

  if (loading)
    return (
      <div className="py-20 flex justify-center">
        <Loader2
          className="animate-spin"
          style={{ color: themeColor }}
          size={40}
        />
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-1.5 h-10 rounded-full"
            style={{ backgroundColor: themeColor }}
          />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white font-inter uppercase leading-none">
              Customer <span style={{ color: themeColor }}>Directory</span>
            </h1>
            <p className="text-[#878C9F] text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">
              Manage your clients
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="h-12 px-6 rounded-lg font-black uppercase text-[12px] tracking-[0.2em] transition-all transform active:scale-95 flex items-center gap-2 shadow-xl text-black"
          style={{
            backgroundColor: themeColor,
            boxShadow: `0 10px 30px ${themeColor}33`,
          }}
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-neutral-500" />
        </div>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-white/20 transition-colors font-medium text-[14px]"
        />
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/[0.03] backdrop-blur-xl rounded-[8px] border border-white/5 border-dashed p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          <div className="w-20 h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative z-10 shadow-inner">
            <Users size={40} className="text-neutral-600" />
          </div>
          <h3 className="text-[24px] font-black text-white uppercase tracking-[0.1em] font-inter mb-3 relative z-10">
            No <span style={{ color: themeColor }}>Customers</span>
          </h3>
          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] font-inter max-w-sm leading-relaxed relative z-10">
            {searchTerm
              ? "No customers found matching your search."
              : "You have not added any customers yet. Add your first customer to start managing your clients."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] overflow-hidden group hover:border-white/10 transition-all shadow-2xl p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"
                  style={{ color: themeColor }}
                >
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white truncate uppercase tracking-tight">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-white/5 text-neutral-400 border border-white/10">
                      {customer.userId ? "Registered" : "Manual"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[13px] font-medium text-neutral-400">
                  <Phone size={16} className="text-neutral-600" />
                  <span className="truncate">
                    {customer.phone || "No phone"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[13px] font-medium text-neutral-400">
                  <Mail size={16} className="text-neutral-600" />
                  <span className="truncate">
                    {customer.email || "No email"}
                  </span>
                </div>
              </div>

              {customer.notes && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">
                    Notes
                  </p>
                  <p className="text-[13px] text-neutral-400 italic line-clamp-3 leading-relaxed">
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl font-inter animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Add New <span style={{ color: themeColor }}>Customer</span>
              </h3>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Notes
                </label>
                <textarea
                  value={newCustomer.notes}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, notes: e.target.value })
                  }
                  placeholder="Additional information..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-[8px] p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-black uppercase text-[12px] tracking-[0.2em] text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 h-12 text-black rounded-lg font-black uppercase text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColor }}
                >
                  {adding ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Save Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
