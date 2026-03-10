/**
 * Staff context for managing current staff user
 * For now, hard-coded to Mabrouka Abuhmida
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';
import { logger } from '@/utils/logger';
import type { Staff } from '@/types';

interface StaffContextType {
  currentStaff: Staff | null;
  loading: boolean;
  refreshStaff: () => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

// Hard-coded staff name for now
const HARDCODED_STAFF_NAME = 'Mabrouka Abuhmida';

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStaff = async () => {
    try {
      setLoading(true);
      // Search for staff by name
      const response = await staffService.list({ page: 1, page_size: 100 });
      
      // Try exact match first, then partial match
      const staff = response.items.find(s => 
        s.full_name.toLowerCase() === HARDCODED_STAFF_NAME.toLowerCase()
      ) || response.items.find(s => 
        s.full_name.toLowerCase().includes(HARDCODED_STAFF_NAME.toLowerCase()) ||
        HARDCODED_STAFF_NAME.toLowerCase().includes(s.full_name.toLowerCase())
      );
      
      if (staff) {
        // Get full staff details
        const fullStaff = await staffService.get(staff.id);
        setCurrentStaff(fullStaff);
      } else {
        logger.warn(`Staff member "${HARDCODED_STAFF_NAME}" not found. Available staff:`, response.items.map(s => s.full_name));
      }
    } catch (error) {
      logger.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  return (
    <StaffContext.Provider value={{ currentStaff, loading, refreshStaff: loadStaff }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = (): StaffContextType => {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};

