import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';

describe('Navbar Component', () => {
  const defaultFilters = {
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    cutoffTime: '11:00',
  };

  it('renders application branding and status indicators', () => {
    render(
      <Navbar
        filters={defaultFilters}
        onFilterChange={vi.fn()}
        activeTab="overview"
        onTabChange={vi.fn()}
        onSync={vi.fn()}
        isSyncing={false}
        onExportCsv={vi.fn()}
        dbConnected={true}
      />
    );

    expect(screen.getByText(/GRIDBRICKS/i)).toBeInTheDocument();
    expect(screen.getByText(/UK DAY-AHEAD/i)).toBeInTheDocument();
    expect(screen.getByText(/MongoDB Atlas/i)).toBeInTheDocument();
  });

  it('triggers onFilterChange when cutoff time is changed', () => {
    const handleFilterChange = vi.fn();
    render(
      <Navbar
        filters={defaultFilters}
        onFilterChange={handleFilterChange}
        activeTab="overview"
        onTabChange={vi.fn()}
        onSync={vi.fn()}
        isSyncing={false}
        onExportCsv={vi.fn()}
        dbConnected={true}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '12:00' } });

    expect(handleFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      cutoffTime: '12:00',
    });
  });

  it('triggers onTabChange when navigation tab is clicked', () => {
    const handleTabChange = vi.fn();
    render(
      <Navbar
        filters={defaultFilters}
        onFilterChange={vi.fn()}
        activeTab="overview"
        onTabChange={handleTabChange}
        onSync={vi.fn()}
        isSyncing={false}
        onExportCsv={vi.fn()}
        dbConnected={true}
      />
    );

    const explorerTab = screen.getByText('Forecast Explorer');
    fireEvent.click(explorerTab);

    expect(handleTabChange).toHaveBeenCalledWith('explorer');
  });
});
