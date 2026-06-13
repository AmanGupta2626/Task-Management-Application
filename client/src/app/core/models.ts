export type Role = 'Manager' | 'TeamLead' | 'Employee';
export type TaskStatus = 'pending' | 'completed';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: Role;
  manager?: string | null;
  teamLead?: string | null;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdBy: User;
  assignedTo: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
}
