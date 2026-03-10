/**
 * Landing page with role choice
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';
import './Landing.css';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handlePGROView = () => {
    const pgrUser: User = {
      id: 'pgr-lead-user',
      email: 'pgrlead@usw.ac.uk',
      full_name: 'PGR Lead User',
      role: 'PGR_LEAD',
      is_active: true,
    };
    setUser(pgrUser);
    navigate('/pgro/dashboard');
  };

  const handleStaffView = () => {
    // Set Mabrouka Abuhmida as the authenticated staff user
    const staffUser: User = {
      id: 'mabrouka-staff',
      email: 'mabrouka.abuhmida@usw.ac.uk',
      full_name: 'Dr Mabrouka Abuhmida',
      role: 'STAFF',
      is_active: true,
    };
    setUser(staffUser);
    // Navigate to staff area - logged in as Mabrouka Abuhmida
    navigate('/staff-portal/allocations');
  };

  const handleAdminView = () => {
    const adminUser: User = {
      id: 'admin-user',
      email: 'admin@usw.ac.uk',
      full_name: 'Admin User',
      role: 'ADMIN',
      is_active: true,
    };
    setUser(adminUser);
    navigate('/admin/staff');
  };

  const handleSMTView = () => {
    const smtUser: User = {
      id: 'smt-user',
      email: 'smt@usw.ac.uk',
      full_name: 'SMT User',
      role: 'SMT',
      is_active: true,
    };
    setUser(smtUser);
    navigate('/pgro/analytics');
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <img 
            src="/usw_logo.png" 
            alt="University of South Wales Logo" 
            className="landing-logo"
          />
          <h1 className="landing-title">PGR Matching System</h1>
          <p className="landing-subtitle">University of South Wales</p>
        </div>
        
        <div className="landing-options">
          <div className="landing-option-card" onClick={handlePGROView}>
            <div className="option-icon">📊</div>
            <h2 className="option-title">PGRO View</h2>
            <p className="option-description">
              Access the full PGR application management system with applicant tracking, 
              allocations, and analytics.
            </p>
            <button className="option-button">Enter PGRO View</button>
          </div>

          <div className="landing-option-card" onClick={handleStaffView}>
            <div className="option-icon">👤</div>
            <h2 className="option-title">Staff View</h2>
            <p className="option-description">
              Review your allocated applications and submit reviews for assigned applicants.
            </p>
            <button className="option-button">Enter Staff View</button>
          </div>

          <div className="landing-option-card" onClick={handleAdminView}>
            <div className="option-icon">⚙️</div>
            <h2 className="option-title">Admin View</h2>
            <p className="option-description">
              Manage staff profiles, view system settings, and perform administrative tasks.
            </p>
            <button className="option-button">Enter Admin View</button>
          </div>

          <div className="landing-option-card" onClick={handleSMTView}>
            <div className="option-icon">📈</div>
            <h2 className="option-title">SMT View</h2>
            <p className="option-description">
              Access comprehensive analytics dashboard with insights into applications, 
              staff capacity, acceptance rates, and research themes.
            </p>
            <button className="option-button">Enter SMT View</button>
          </div>
        </div>
      </div>
    </div>
  );
};

