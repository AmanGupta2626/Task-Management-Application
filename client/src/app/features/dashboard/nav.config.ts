import { Role } from '../../core/models';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  Employee: [{ label: 'Tasks', route: '/tasks', icon: 'tasks' }],
  TeamLead: [
    { label: 'Tasks', route: '/tasks', icon: 'tasks' },
    { label: 'Team', route: '/team', icon: 'team' },
  ],
  Manager: [
    { label: 'Tasks', route: '/tasks', icon: 'tasks' },
    { label: 'Team', route: '/team', icon: 'team' },
  ],
};

export const ROLE_TITLES: Record<Role, string> = {
  Employee: 'ENTERPRISE MEMBER',
  TeamLead: 'TEAM LEAD',
  Manager: 'ENTERPRISE MANAGER',
};
