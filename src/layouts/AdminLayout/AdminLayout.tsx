/**
 * AdminLayout - Layout for admin area with admin-specific navigation
 */
import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useStaff } from '@/contexts/StaffContext';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { currentStaff, loading } = useStaff();

  const navItems = [
    { path: '/admin/staff', label: 'Staff Management' },
  ];

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
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
            <div className="admin-info">
              <span className="admin-name">{currentStaff.full_name}</span>
            </div>
          )}
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/" className="nav-link back-link">
            ← Back to Landing
          </Link>
        </nav>
      </header>
      <main className="admin-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

