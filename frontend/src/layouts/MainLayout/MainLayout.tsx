/**
 * MainLayout - USW-style header with top navigation
 */
import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const { hasRole } = useAuth();

  // For SMT users: only show Analytics
  // For PGR_LEAD users: show Dashboard, Applicants, Allocations, Review Records, Interview Records (no Analytics)
  // For ADMIN users: show all except Analytics
  const navItems = hasRole('SMT')
    ? [{ path: '/pgro/analytics', label: 'Analytics' }]
    : [
        { path: '/pgro/dashboard', label: 'Dashboard' },
        { path: '/pgro/applicants', label: 'Applicants' },
        { path: '/pgro/allocations', label: 'Allocations' },
        { path: '/pgro/review-records', label: 'Review Records' },
        { path: '/pgro/interview-records', label: 'Interview Records' },
      ];

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-logo-container">
              <img 
                src="/usw_logo.png" 
                alt="University of South Wales Logo" 
                className="brand-logo"
              />
            </div>
            <div className="brand-text">
              <h1 className="brand-title">PGR Matching</h1>
              <span className="brand-subtitle">University of South Wales</span>
            </div>
          </div>
          <nav className="main-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

