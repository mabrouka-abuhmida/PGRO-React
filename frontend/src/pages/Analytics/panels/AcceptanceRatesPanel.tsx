/**
 * AcceptanceRatesPanel - Holistic acceptance and rejection rates visualization
 */
import React from 'react';
import { Card } from '@/components';
import { useAcceptanceRatesAnalytics } from '@/hooks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import './panels.css';


interface AcceptanceRatesPanelProps {
  // No props needed - fetches its own data
}

export const AcceptanceRatesPanel: React.FC<AcceptanceRatesPanelProps> = () => {
  const { data, isLoading: loading } = useAcceptanceRatesAnalytics();

  if (loading) {
    return (
      <div className="analytics-panel">
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Acceptance & Rejection Rates</h2>
          <p>Loading rates data...</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-panel">
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Acceptance & Rejection Rates</h2>
          <p>No data available</p>
        </Card>
      </div>
    );
  }

  const { overall, by_degree_type, by_intake, trends } = data;

  // Overall status distribution
  const overallStatusData = [
    { name: 'Accepted', value: overall.accepted, color: '#00C49F' },
    { name: 'Rejected', value: overall.rejected, color: '#FF8042' },
    { name: 'Pending', value: overall.pending, color: '#FFBB28' },
  ];

  // By degree type comparison
  const degreeComparisonData = [
    {
      degree_type: 'PhD',
      accepted: by_degree_type.PHD?.accepted || 0,
      rejected: by_degree_type.PHD?.rejected || 0,
      pending: by_degree_type.PHD?.pending || 0,
      acceptance_rate: by_degree_type.PHD?.acceptance_rate || 0,
      rejection_rate: by_degree_type.PHD?.rejection_rate || 0,
    },
    {
      degree_type: 'MRes',
      accepted: by_degree_type.MRES?.accepted || 0,
      rejected: by_degree_type.MRES?.rejected || 0,
      pending: by_degree_type.MRES?.pending || 0,
      acceptance_rate: by_degree_type.MRES?.acceptance_rate || 0,
      rejection_rate: by_degree_type.MRES?.rejection_rate || 0,
    },
  ];

  return (
    <div className="analytics-panel">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Total Applications</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>{overall.total_applications}</p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Acceptance Rate</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#00C49F' }}>{overall.acceptance_rate}%</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#666' }}>
            {overall.accepted} accepted
          </p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Rejection Rate</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#FF8042' }}>{overall.rejection_rate}%</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#666' }}>
            {overall.rejected} rejected
          </p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Pending</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#FFBB28' }}>{overall.pending_rate}%</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#666' }}>
            {overall.pending} pending
          </p>
        </Card>
      </div>

      {/* Overall Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Overall Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={overallStatusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                minAngle={5}
              >
                {overallStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Acceptance vs Rejection Rates</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={degreeComparisonData}
              margin={{ top: 20, right: 30, bottom: 20, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="degree_type"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Rate %', angle: -90, position: 'insideLeft' }}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Bar dataKey="acceptance_rate" fill="#00C49F" name="Acceptance Rate" />
              <Bar dataKey="rejection_rate" fill="#FF8042" name="Rejection Rate" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Trends Over Time */}
      {trends.length > 0 && (
        <Card variant="elevated" className="chart-card" style={{ marginBottom: '2rem' }}>
          <h2 className="chart-title">Acceptance Rate Trends Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={trends}
              margin={{ top: 20, right: 30, bottom: 20, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Rate %', angle: -90, position: 'insideLeft' }}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="acceptance_rate" stroke="#00C49F" strokeWidth={2} name="Acceptance Rate" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* By Intake */}
      {by_intake.length > 0 && (
        <Card variant="elevated" className="chart-card" style={{ marginBottom: '2rem' }}>
          <h2 className="chart-title">Rates by Intake</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={by_intake}
              margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="intake_term" 
                label={{ value: 'Intake', position: 'insideBottom', offset: -5 }}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis 
                label={{ value: 'Rate %', angle: -90, position: 'insideLeft' }}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Bar dataKey="acceptance_rate" fill="#00C49F" name="Acceptance Rate" />
              <Bar dataKey="rejection_rate" fill="#FF8042" name="Rejection Rate" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

