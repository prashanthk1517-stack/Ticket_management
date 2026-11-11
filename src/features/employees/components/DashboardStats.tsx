import type { EmployeeStats } from '../types/employee.types';
import { formatSalary } from '../utils/employee.utils';
import { Card } from '../../../components/ui';

interface DashboardStatsProps {
  stats: EmployeeStats;
}

const statDetails = [
  { key: 'total', label: 'Total employees', icon: 'users', tone: 'violet' },
  { key: 'active', label: 'Active employees', icon: 'check', tone: 'green' },
  { key: 'inactive', label: 'Inactive employees', icon: 'minus', tone: 'amber' },
  { key: 'averageSalary', label: 'Average salary', icon: 'dollar', tone: 'blue' },
] as const;

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="stats-grid" aria-label="Employee statistics">
      {statDetails.map(({ key, label, icon, tone }) => (
        <Card className="stat-card" key={key}>
          <div className={`stat-icon stat-icon--${tone}`} aria-hidden="true">
            {icon === 'users' && (
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            )}
            {icon === 'check' && (
              <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
            )}
            {icon === 'minus' && (
              <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
            )}
            {icon === 'dollar' && (
              <svg viewBox="0 0 24 24"><path d="M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            )}
          </div>
          <div>
            <p className="stat-label">{label}</p>
            <p className="stat-value">
              {key === 'averageSalary'
                ? formatSalary(stats.averageSalary)
                : stats[key].toLocaleString()}
            </p>
          </div>
        </Card>
      ))}
    </section>
  );
}
