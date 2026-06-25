import React from "react";
import Avatar from "react-avatar";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@kridaz/ui";


const TransactionTable = ({
  transactions,
  sortField,
  sortDirection,
  onSort,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/5">
            <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">
              User
            </th>
            <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">
              <Button
                className="flex items-center group transition-colors hover:text-secondary"
                onClick={() => onSort("createdAt")}
              >
                Date
                {sortField === "createdAt" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-2 h-3 w-3 text-secondary" />
                  ) : (
                    <ChevronDown className="ml-2 h-3 w-3 text-secondary" />
                  ))}
              </Button>
            </th>
            <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">
              Venue
            </th>
            <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">
              Order ID
            </th>
            <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">
              Payment ID
            </th>
            <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-white/5 text-right">
              <Button
                className="flex items-center justify-end w-full group transition-colors hover:text-secondary"
                onClick={() => onSort("totalPrice")}
              >
                Amount
                {sortField === "totalPrice" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-2 h-3 w-3 text-secondary" />
                  ) : (
                    <ChevronDown className="ml-2 h-3 w-3 text-secondary" />
                  ))}
              </Button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.map((transaction) => (
            <tr
              key={transaction._id}
              className="group hover:bg-white/[0.02] transition-colors"
            >
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-white/5 group-hover:bg-secondary/20 transition-colors">
                    <Avatar
                      name={transaction.user?.name || "Unknown"}
                      size="32"
                      round={true}
                    />
                  </div>
                  <span className="font-bold text-sm tracking-tight">
                    {transaction.user?.name || "Unknown"}
                  </span>
                </div>
              </td>
              <td className="p-4 text-xs font-medium text-gray-400">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </td>
              <td className="p-4">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                  {transaction.turf?.name || "Unknown"}
                </span>
              </td>
              <td className="p-4 text-xs text-gray-500 truncate max-w-[120px]">
                {transaction.payment?.orderId || "N/A"}
              </td>
              <td className="p-4 text-xs text-gray-500 truncate max-w-[120px]">
                {transaction.payment?.paymentId || "N/A"}
              </td>
              <td className="p-4 text-right">
                <span className="font-bold text-sm text-secondary tracking-tight">
                  Rs {transaction.totalPrice}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
