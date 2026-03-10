/**
 * AnalyticsLayout - Sidebar layout for analytics dashboard
 */
import React from 'react';
import { Button } from '@/components';
import './AnalyticsLayout.css';

export type AnalyticsPanel = 
  | 'overview'
  | 'status-distribution'
  | 'degree-distribution'
  | 'intake-trends'
  | 'application-pipeline'
  | 'research-themes'
  | 'topic-keywords'
  | 'accelerator-correlation'
  | 'staff-capacity'
  | 'research-group-coverage'
  | 'acceptance-rates'
  | 'staff-performance-rates';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
  onPanelChange: (panel: AnalyticsPanel) => void;
  currentPanel: AnalyticsPanel;
  onPrint?: () => void;
}

export const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({
  children,
  onPanelChange,
  currentPanel,
  onPrint,
}) => {
  // Icon component helper
  const Icon = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span className={`sidebar-icon ${className}`}>{children}</span>
  );

  const sidebarSections = [
    {
      title: 'Overview',
      items: [
        { id: 'overview' as AnalyticsPanel, label: 'Overview Dashboard', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></Icon>
        ) },
      ],
    },
    {
      title: 'Applications',
      items: [
        { id: 'status-distribution' as AnalyticsPanel, label: 'Status Distribution', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg></Icon>
        ) },
        { id: 'degree-distribution' as AnalyticsPanel, label: 'Degree Type Distribution', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></Icon>
        ) },
        { id: 'intake-trends' as AnalyticsPanel, label: 'Intake Trends', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></Icon>
        ) },
        { id: 'application-pipeline' as AnalyticsPanel, label: 'Application Pipeline', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></Icon>
        ) },
      ],
    },
    {
      title: 'Themes & Accelerators',
      items: [
        { id: 'research-themes' as AnalyticsPanel, label: 'Research Themes Overview', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path></svg></Icon>
        ) },
        { id: 'topic-keywords' as AnalyticsPanel, label: 'Topic Keywords', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg></Icon>
        ) },
        { id: 'accelerator-correlation' as AnalyticsPanel, label: 'Accelerators vs Research Themes', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></Icon>
        ) },
      ],
    },
    {
      title: 'Staff & Capacity',
      items: [
        { id: 'staff-capacity' as AnalyticsPanel, label: 'Staff Load & Capacity', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></Icon>
        ) },
        { id: 'research-group-coverage' as AnalyticsPanel, label: 'Research Group Coverage', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></Icon>
        ) },
        { id: 'acceptance-rates' as AnalyticsPanel, label: 'Acceptance & Rejection Rates', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></Icon>
        ) },
        { id: 'staff-performance-rates' as AnalyticsPanel, label: 'Staff Performance Rates', icon: (
          <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg></Icon>
        ) },
      ],
    },
  ];

  return (
    <div className="analytics-layout">
      <aside className="analytics-sidebar">
        <div className="sidebar-header">
          <h2>Analytics</h2>
        </div>
        <nav className="sidebar-nav">
          {sidebarSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="sidebar-section">
              <h3 className="section-title">{section.title}</h3>
              <ul className="section-items">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`sidebar-item ${currentPanel === item.id ? 'active' : ''}`}
                      onClick={() => onPanelChange(item.id)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className="analytics-main">
        <div className="analytics-header">
          <div className="header-content">
            <h1 className="page-title">Analytics Dashboard</h1>
            {onPrint && (
              <Button 
                variant="primary" 
                size="sm"
                onClick={onPrint}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                }
                iconPosition="left"
              >
                Print / Save as PDF
              </Button>
            )}
          </div>
        </div>
        <div className="analytics-content">
          {children}
        </div>
      </main>
    </div>
  );
};

