import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../components/KPICard';
import { Wind } from 'lucide-react';

describe('KPICard Component', () => {
  it('renders title and formatted numeric value correctly', () => {
    render(
      <KPICard
        title="Average Forecast Generation"
        value={12450}
        unit="MW"
        subtitle="At decision cutoff"
        icon={Wind}
      />
    );

    expect(screen.getByText('Average Forecast Generation')).toBeInTheDocument();
    expect(screen.getByText('12,450')).toBeInTheDocument();
    expect(screen.getByText('MW')).toBeInTheDocument();
    expect(screen.getByText('At decision cutoff')).toBeInTheDocument();
  });

  it('renders badge correctly when provided', () => {
    render(
      <KPICard
        title="MAE"
        value={150.5}
        unit="MW"
        icon={Wind}
        badge={{ text: 'Required KPI', type: 'warning' }}
      />
    );

    expect(screen.getByText('Required KPI')).toBeInTheDocument();
  });

  it('renders dash when value is null', () => {
    render(
      <KPICard
        title="Empty Metric"
        value={null}
        icon={Wind}
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
