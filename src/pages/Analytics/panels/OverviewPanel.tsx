/**
 * OverviewPanel - High-level dashboard with key metrics and compact charts
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

interface OverviewPanelProps {
  statistics: {
    total_applications: number;
    status_breakdown: Record<string, number>;
    degree_breakdown: Record<string, number>;
    with_topics: number;
    research_group_coverage: Array<{
      research_group: string;
      applicant_count: number;
    }>;
  } | null;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ statistics }) => {
  const statusData = statistics
    ? Object.entries(statistics.status_breakdown).map(([status, count]) => ({
        name: status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        value: count,
      }))
    : [];

  const degreeData = statistics
    ? Object.entries(statistics.degree_breakdown).map(([degree, count]) => ({
        name: degree,
        value: count,
      }))
    : [];

  return (
    <div className="analytics-panel">
      {/* Key Metrics */}
      {statistics && (
        <div className="stats-grid">
          <Card variant="elevated" className="stat-card">
            <h3>Total Applications</h3>
            <div className="stat-value">{statistics.total_applications}</div>
          </Card>
          <Card variant="elevated" className="stat-card">
            <h3>With Topics</h3>
            <div className="stat-value">{statistics.with_topics}</div>
            <div className="stat-percentage">
              {statistics.total_applications > 0
                ? (
                    (statistics.with_topics / statistics.total_applications) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </Card>
          <Card variant="elevated" className="stat-card">
            <h3>Research Groups</h3>
            <div className="stat-value">
              {statistics.research_group_coverage.length}
            </div>
          </Card>
        </div>
      )}

      {/* Compact Charts */}
      <div className="overview-charts">
        {statusData.length > 0 && (
          <Card variant="elevated" className="chart-card compact">
            <h2 className="chart-title">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
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
                  outerRadius={70}
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
        )}

        {degreeData.length > 0 && (
          <Card variant="elevated" className="chart-card compact">
            <h2 className="chart-title">Degree Type Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={degreeData}
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
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  minAngle={5}
                >
                  {degreeData.map((_, index) => (
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
        )}
      </div>
    </div>
  );
};
