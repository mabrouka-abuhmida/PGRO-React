/**
 * StaffCapacityPanel - Staff load & capacity visualization
 */
import React from 'react';
import { Card } from '@/components';
import { useStaffCapacityAnalytics } from '@/hooks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './panels.css';

interface StaffCapacityPanelProps {
  // No props needed - fetches its own data
}

export const StaffCapacityPanel: React.FC<StaffCapacityPanelProps> = () => {
  const { data, isLoading: loading } = useStaffCapacityAnalytics();

  if (loading) {
    return (
      <div className="analytics-panel">
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Staff Load & Capacity</h2>
          <p>Loading capacity data...</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-panel">
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Staff Load & Capacity</h2>
          <p>No data available</p>
        </Card>
      </div>
    );
  }

  const { summary, staff_details } = data;

  // Prepare capacity status distribution data
  const capacityStatusData = [
    { name: 'Available (PhD)', value: summary.staff_with_capacity_phd },
    { name: 'At Capacity (PhD)', value: summary.staff_at_capacity_phd },
    { name: 'Over Capacity (PhD)', value: summary.staff_over_capacity_phd },
  ];

  const mresStatusData = [
    { name: 'Available (MRes)', value: summary.staff_with_capacity_mres },
    { name: 'At Capacity (MRes)', value: summary.staff_at_capacity_mres },
    { name: 'Over Capacity (MRes)', value: summary.staff_over_capacity_mres },
  ];

  // Top 10 staff by utilization (PhD)
  const topUtilization = [...staff_details]
    .sort((a, b) => b.phd_utilization_percent - a.phd_utilization_percent)
    .slice(0, 10)
    .map(staff => ({
      name: staff.full_name.length > 20 ? staff.full_name.substring(0, 20) + '...' : staff.full_name,
      utilization: staff.phd_utilization_percent,
      current: staff.current_phd_supervisions,
      max: staff.max_phd_supervisions
    }));

  // Top 10 staff by utilization (MRes)
  const topUtilizationMRes = [...staff_details]
    .sort((a, b) => b.mres_utilization_percent - a.mres_utilization_percent)
    .slice(0, 10)
    .map(staff => ({
      name: staff.full_name.length > 20 ? staff.full_name.substring(0, 20) + '...' : staff.full_name,
      utilization: staff.mres_utilization_percent,
      current: staff.current_mres_supervisions,
      max: staff.max_mres_supervisions
    }));

  return (
    <div className="analytics-panel">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Total Staff</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>{summary.total_staff}</p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>PhD Capacity</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
            {summary.total_phd_used} / {summary.total_phd_capacity}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#666' }}>
            {summary.total_phd_available} available
          </p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>MRes Capacity</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
            {summary.total_mres_used} / {summary.total_mres_capacity}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#666' }}>
            {summary.total_mres_available} available
          </p>
        </Card>
        <Card variant="elevated" className="summary-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#666' }}>Overall Utilization</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
            {summary.total_phd_capacity + summary.total_mres_capacity > 0
              ? Math.round(((summary.total_phd_used + summary.total_mres_used) / (summary.total_phd_capacity + summary.total_mres_capacity)) * 100)
              : 0}%
          </p>
        </Card>
      </div>

      {/* Capacity Status Distribution - Using Horizontal Bar Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">PhD Capacity Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={capacityStatusData}
              layout="vertical"
              margin={{ top: 20, right: 30, bottom: 20, left: 150 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} staff members`, 'Count']}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {capacityStatusData.map((entry, index) => {
                  let color = '#00C49F'; // Available - Green
                  if (entry.name.includes('At Capacity')) color = '#FFBB28'; // At Capacity - Yellow
                  if (entry.name.includes('Over Capacity')) color = '#FF8042'; // Over Capacity - Red
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Summary below chart */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {capacityStatusData.map((entry, index) => {
              let color = '#00C49F';
              if (entry.name.includes('At Capacity')) color = '#FFBB28';
              if (entry.name.includes('Over Capacity')) color = '#FF8042';
              const total = capacityStatusData.reduce((sum, e) => sum + e.value, 0);
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: color }}></div>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {entry.name.replace(' (PhD)', '')}: <strong style={{ color: '#1F2937' }}>{entry.value}</strong> ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">MRes Capacity Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={mresStatusData}
              layout="vertical"
              margin={{ top: 20, right: 30, bottom: 20, left: 150 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} staff members`, 'Count']}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {mresStatusData.map((entry, index) => {
                  let color = '#00C49F'; // Available - Green
                  if (entry.name.includes('At Capacity')) color = '#FFBB28'; // At Capacity - Yellow
                  if (entry.name.includes('Over Capacity')) color = '#FF8042'; // Over Capacity - Red
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Summary below chart */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {mresStatusData.map((entry, index) => {
              let color = '#00C49F';
              if (entry.name.includes('At Capacity')) color = '#FFBB28';
              if (entry.name.includes('Over Capacity')) color = '#FF8042';
              const total = mresStatusData.reduce((sum, e) => sum + e.value, 0);
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: color }}></div>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {entry.name.replace(' (MRes)', '')}: <strong style={{ color: '#1F2937' }}>{entry.value}</strong> ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Utilization Charts - PhD and MRes side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Top 10 Staff by PhD Utilization</h2>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={topUtilization}
              margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 11 }}
                interval={0}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <YAxis 
                label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'utilization') return `${value}%`;
                  return value;
                }}
                labelFormatter={(label) => `Staff: ${label}`}
              />
              <Legend />
              <Bar dataKey="utilization" fill="#0088FE" name="Utilization %" />
              <Bar dataKey="current" fill="#00C49F" name="Current" />
              <Bar dataKey="max" fill="#FFBB28" name="Max Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Top 10 Staff by MRes Utilization</h2>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={topUtilizationMRes}
              margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 11 }}
                interval={0}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <YAxis 
                label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'utilization') return `${value}%`;
                  return value;
                }}
                labelFormatter={(label) => `Staff: ${label}`}
              />
              <Legend />
              <Bar dataKey="utilization" fill="#0088FE" name="Utilization %" />
              <Bar dataKey="current" fill="#00C49F" name="Current" />
              <Bar dataKey="max" fill="#FFBB28" name="Max Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Staff Details Table */}
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Staff Capacity Details</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Staff Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>School</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Research Group</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>PhD (Used/Max)</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>PhD Utilization</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>MRes (Used/Max)</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>MRes Utilization</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff_details.slice(0, 20).map((staff) => (
                <tr key={staff.staff_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{staff.full_name}</td>
                  <td style={{ padding: '0.75rem' }}>{staff.school || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{staff.research_group || '-'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {staff.current_phd_supervisions} / {staff.max_phd_supervisions}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {staff.phd_utilization_percent.toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {staff.current_mres_supervisions} / {staff.max_mres_supervisions}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {staff.mres_utilization_percent.toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: staff.capacity_status_phd === 'AVAILABLE' ? '#d1fae5' :
                                  staff.capacity_status_phd === 'FULL' ? '#fef3c7' : '#fee2e2',
                      color: staff.capacity_status_phd === 'AVAILABLE' ? '#065f46' :
                             staff.capacity_status_phd === 'FULL' ? '#92400e' : '#991b1b'
                    }}>
                      {staff.capacity_status_phd}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {staff_details.length > 20 && (
          <p style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
            Showing 20 of {staff_details.length} staff members
          </p>
        )}
      </Card>
    </div>
  );
};
