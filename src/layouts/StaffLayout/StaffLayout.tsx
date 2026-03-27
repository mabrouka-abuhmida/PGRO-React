/**
 * StaffLayout - Layout for staff area with staff-specific navigation
 */
import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useStaff } from '@/contexts/StaffContext';
import './StaffLayout.css';

export const StaffLayout: React.FC = () => {
  const location = useLocation();
  const { currentStaff, loading } = useStaff();

  const navItems = [
    { path: '/staff-portal/allocations', label: 'My Allocations' },
    { path: '/staff-portal/interviews', label: 'My Interviews' },
    { path: '/staff-portal/profile', label: 'My Profile' },
  ];

  if (loading) {
    return (
      <div className="staff-layout">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-layout">
      <header className="staff-header">
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
              <h1 className="brand-title">PGR Matching System</h1>
              <span className="brand-subtitle">University of South Wales</span>
            </div>
          </div>
          {currentStaff && (
            <div className="staff-info">
              <span className="staff-name">{currentStaff.full_name}</span>
            </div>
          )}
        </div>
        <nav className="staff-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/" className="nav-link back-link">
            ← Back to Landing
          </Link>
        </nav>
      </header>
      <main className="staff-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

