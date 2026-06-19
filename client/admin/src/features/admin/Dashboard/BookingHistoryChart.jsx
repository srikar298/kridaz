import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BookingHistoryChart = ({ data }) => (
  <div className="w-full h-[400px] mt-4">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#71b300" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#71b300" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#444"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#666", fontWeight: 900, fontSize: 10 }}
        />
        <YAxis
          stroke="#444"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#666", fontWeight: 900, fontSize: 10 }}
          tickFormatter={(value) => `Rs ${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #71b300",
            borderRadius: "4px",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            textTransform: "uppercase",
            fontWeight: "900",
            fontStyle: "italic",
          }}
          itemStyle={{ color: "#71b300" }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#71b300"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorAmount)"
          animationDuration={2000}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default BookingHistoryChart;
