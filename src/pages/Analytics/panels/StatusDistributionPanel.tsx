/**
 * StatusDistributionPanel - Application status distribution pie chart + table
 */
import React from "react";
import { Card } from "@/components";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "./panels.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
];

interface StatusDistributionPanelProps {
  statistics: {
    status_breakdown: Record<string, number>;
  } | null;
}

export const StatusDistributionPanel: React.FC<
  StatusDistributionPanelProps
> = ({ statistics }) => {
  const statusData = statistics
    ? Object.entries(statistics.status_breakdown)
        .map(([status, count]) => ({
          name: status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
          rawName: status,
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const total = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Application Status Distribution</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => {
                return (
                  <>
                    {percent && percent > 0.05 ? (
                      <p>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      </p>
                    ) : (
                      <p></p>
                    )}
                  </>
                );
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              minAngle={5}
            >
              {statusData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Status Table */}
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Status Breakdown</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {statusData.map((item) => (
              <tr key={item.rawName}>
                <td>{item.name}</td>
                <td>{item.value}</td>
                <td>
                  {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
