import useTransactionData from "@hooks/admin/useTransactionData";
import TransactionSkeleton from "./TransactionSkeleton";
import TransactionFilters from "./TransactionFilters";
import TransactionTable from "./TransactionTable";
import useTransactionManagement from "@hooks/admin/useTransactionManagement.jsx";

const TransactionSection = () => {
  const { transactions, loading, error } = useTransactionData();

  const {
    filters,
    sortField,
    sortDirection,
    filteredAndSortedTransactions,
    handleFilterChange,
    clearFilters,
    toggleSort,
  } = useTransactionManagement(transactions);

  if (loading) return <TransactionSkeleton />;
  if (error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-[8px] p-8 text-center">
          <p className="font-bold text-xl text-red-500 uppercase tracking-widest">
            System Error Detected
          </p>
          <p className="text-sm text-red-400 mt-2">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-secondary rounded-full shadow-[0_0_15px_rgba(85, 222, 232,0.5)]" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
            Financial <span className="text-secondary">Ledger</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Platform Transaction & Revenue Flow
          </p>
        </div>

        {/* Compact single-row filter bar */}
        <TransactionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
        />

        {/* Table */}
        <div className="bg-card rounded-[8px] border border-white/10 overflow-hidden">
          <TransactionTable
            transactions={filteredAndSortedTransactions}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={toggleSort}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionSection;
