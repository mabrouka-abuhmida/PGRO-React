/**
 * StaffPerformanceRatesPanel - Individual staff acceptance and rejection rates
 */
import React from 'react';
import { Card } from '@/components';
import { useAcceptanceRatesAnalytics } from '@/hooks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './panels.css';

type StaffPerformanceData = {
  staff_id: string;
  staff_name: string;
  school: string;
  research_group: string;
  total_allocations: number;
  confirmed_allocations: number;
  applicants_accepted: number;
  applicants_rejected: number;
  applicants_pending: number;
  acceptance_rate: number;
  rejection_rate: number;
  pending_rate: number;
};

interface StaffPerformanceRatesPanelProps {
  // No props needed - fetches its own data
}

export const StaffPerformanceRatesPanel: React.FC<StaffPerformanceRatesPanelProps> = () => {
  const { data, isLoading: loading } = useAcceptanceRatesAnalytics();

  if (loading) {
    return (
      <div className="analytics-panel">
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Staff Performance Rates</h2>
          <p>Loading performance data...</p>
        </Card>
      </div>
    );
  }

  if (!data || !data.by_staff || data.by_staff.length === 0) {
    return (
      <div className="analytics-panel">
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Staff Performance Rates</h2>
          <p>No staff performance data available</p>
        </Card>
      </div>
    );
  }

  const { by_staff } = data;

  // Sort by acceptance rate (highest first)
  const sortedStaff = [...by_staff].sort((a, b) => b.acceptance_rate - a.acceptance_rate);

  // Top 15 staff by acceptance rate for chart
  const topStaff = sortedStaff.slice(0, 15).map(staff => ({
    name: staff.staff_name.length > 20 ? staff.staff_name.substring(0, 20) + '...' : staff.staff_name,
    acceptance_rate: staff.acceptance_rate,
    rejection_rate: staff.rejection_rate,
    pending_rate: staff.pending_rate,
    total: staff.confirmed_allocations
  }));

  return (
    <div className="analytics-panel">
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Staff with Allocations</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>{by_staff.length}</p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Average Acceptance Rate</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#00C49F' }}>
            {by_staff.length > 0
              ? (by_staff.reduce((sum: number, s) => sum + s.acceptance_rate, 0) / by_staff.length).toFixed(1)
              : 0}%
          </p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Average Rejection Rate</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#FF8042' }}>
            {by_staff.length > 0
              ? (by_staff.reduce((sum: number, s) => sum + s.rejection_rate, 0) / by_staff.length).toFixed(1)
              : 0}%
          </p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Total Allocations</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
            {by_staff.reduce((sum: number, s) => sum + s.confirmed_allocations, 0)}
          </p>
        </Card>
      </div>

      {/* Top Staff Performance Chart */}
      <Card variant="elevated" className="chart-card" style={{ marginBottom: '2rem' }}>
        <h2 className="chart-title">Top 15 Staff by Acceptance Rate</h2>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart 
            data={topStaff}
            margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={120}
              tick={{ fontSize: 11 }}
              interval={0}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
            />
            <YAxis 
              label={{ value: 'Rate %', angle: -90, position: 'insideLeft' }}
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => `${value}%`}
              labelFormatter={(label) => `Staff: ${label}`}
            />
            <Legend />
            <Bar dataKey="acceptance_rate" fill="#00C49F" name="Acceptance Rate" />
            <Bar dataKey="rejection_rate" fill="#FF8042" name="Rejection Rate" />
            <Bar dataKey="pending_rate" fill="#FFBB28" name="Pending Rate" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Staff Performance Table */}
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Individual Staff Performance</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Staff Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>School</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Research Group</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Total Allocations</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Accepted</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Rejected</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Pending</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Acceptance Rate</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Rejection Rate</th>
              </tr>
            </thead>
            <tbody>
              {sortedStaff.map((staff: StaffPerformanceData) => (
                <tr key={staff.staff_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{staff.staff_name}</td>
                  <td style={{ padding: '0.75rem' }}>{staff.school || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{staff.research_group || '-'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{staff.confirmed_allocations}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#00C49F', fontWeight: 500 }}>
                    {staff.applicants_accepted}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#FF8042', fontWeight: 500 }}>
                    {staff.applicants_rejected}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#FFBB28', fontWeight: 500 }}>
                    {staff.applicants_pending}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: staff.acceptance_rate >= 50 ? '#d1fae5' : 
                                  staff.acceptance_rate >= 30 ? '#fef3c7' : '#fee2e2',
                      color: staff.acceptance_rate >= 50 ? '#065f46' : 
                             staff.acceptance_rate >= 30 ? '#92400e' : '#991b1b'
                    }}>
                      {staff.acceptance_rate}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {staff.rejection_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

