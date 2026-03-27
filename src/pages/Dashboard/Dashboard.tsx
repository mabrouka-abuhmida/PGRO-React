/**
 * Dashboard - Intake overview with cards for each intake
 */
import React, { useMemo } from 'react';
import { Card, Badge } from '@/components';
import { useIntakeSummary } from '@/hooks';
import type { IntakeSummary } from '@/types';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { data: intakeData = [], isLoading: loading } = useIntakeSummary();

  // Process intake data to ensure JAN and OCT for current year exist
  const intakes = useMemo(() => {
    // If no data, show current year with zeros
    if (intakeData.length === 0) {
      const currentYear = new Date().getFullYear();
      return [
        {
          year: currentYear,
          term: 'JAN',
          total: 0,
          new: 0,
          supervisor_contacted: 0,
          accepted: 0,
          rejected: 0,
          under_review: 0,
          on_hold: 0,
        },
        {
          year: currentYear,
          term: 'OCT',
          total: 0,
          new: 0,
          supervisor_contacted: 0,
          accepted: 0,
          rejected: 0,
          under_review: 0,
          on_hold: 0,
        },
      ];
    }

    // Ensure we have JAN and OCT for the current year if they don't exist
    const currentYear = new Date().getFullYear();
    const intakeMap = new Map<string, IntakeSummary>();
    
    // Add existing intakes
    intakeData.forEach((intake: IntakeSummary) => {
      const key = `${intake.year}-${intake.term}`;
      intakeMap.set(key, intake);
    });
    
    // Add missing JAN and OCT for current year if not present
    const janKey = `${currentYear}-JAN`;
    const octKey = `${currentYear}-OCT`;
    
    if (!intakeMap.has(janKey)) {
      intakeMap.set(janKey, {
        year: currentYear,
        term: 'JAN',
        total: 0,
        new: 0,
        supervisor_contacted: 0,
        accepted: 0,
        rejected: 0,
        under_review: 0,
        on_hold: 0,
      });
    }
    
    if (!intakeMap.has(octKey)) {
      intakeMap.set(octKey, {
        year: currentYear,
        term: 'OCT',
        total: 0,
        new: 0,
        supervisor_contacted: 0,
        accepted: 0,
        rejected: 0,
        under_review: 0,
        on_hold: 0,
      });
    }
    
    // Convert to array and sort
    const intakesArray = Array.from(intakeMap.values());
    intakesArray.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year; // Descending year
      // JAN comes before OCT
      if (a.term === 'JAN' && b.term === 'OCT') return -1;
      if (a.term === 'OCT' && b.term === 'JAN') return 1;
      return 0;
    });
    
    return intakesArray;
  }, [intakeData]);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="h-hero">Dashboard</h1>
      <p className="body-large mb-4">Overview of PGR application intakes</p>

      <div className="intake-grid">
        {intakes.map((intake) => (
          <Card key={`${intake.year}-${intake.term}`} variant="elevated">
            <div className="intake-card-header">
              <h2 className="h-section">{intake.term} {intake.year}</h2>
              <Badge variant="info">{intake.total} Total</Badge>
            </div>
            <div className="intake-stats">
              <div className="stat-item">
                <span className="stat-label">New</span>
                <Badge variant="default">{intake.new}</Badge>
              </div>
              <div className="stat-item">
                <span className="stat-label">Contacted</span>
                <Badge variant="warning">{intake.supervisor_contacted}</Badge>
              </div>
              <div className="stat-item">
                <span className="stat-label">Accepted</span>
                <Badge variant="success">{intake.accepted}</Badge>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rejected</span>
                <Badge variant="error">{intake.rejected}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

