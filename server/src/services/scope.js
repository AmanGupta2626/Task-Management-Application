import User from '../models/User.js';

export async function getSubordinateIds(user) {
  if (user.role === 'Manager') {
    const teamLeads = await User.find({ role: 'TeamLead', manager: user._id }).select('_id');
    const teamLeadIds = teamLeads.map((tl) => tl._id);
    const employees = await User.find({
      role: 'Employee',
      teamLead: { $in: teamLeadIds },
    }).select('_id');
    return [...teamLeadIds, ...employees.map((e) => e._id)];
  }

  if (user.role === 'TeamLead') {
    const employees = await User.find({ role: 'Employee', teamLead: user._id }).select('_id');
    return employees.map((e) => e._id);
  }

  return [];
}

export async function getScopeUserIds(user) {
  const subordinates = await getSubordinateIds(user);
  return [user._id, ...subordinates];
}

export async function getAssignableUsers(user) {
  if (user.role === 'Employee') {
    return [user];
  }
  const ids = await getScopeUserIds(user);
  return User.find({ _id: { $in: ids } }).select('username email role');
}

export async function buildTaskVisibilityFilter(user) {
  if (user.role === 'Employee') {
    return { $or: [{ assignedTo: user._id }, { createdBy: user._id }] };
  }
  const ids = await getScopeUserIds(user);
  return { $or: [{ assignedTo: { $in: ids } }, { createdBy: { $in: ids } }] };
}

export async function canAssignTo(user, targetUserId) {
  if (user.role === 'Employee') {
    return String(targetUserId) === String(user._id);
  }
  const ids = await getScopeUserIds(user);
  return ids.some((id) => String(id) === String(targetUserId));
}

export async function canAccessTask(user, task) {
  if (user.role === 'Employee') {
    return (
      String(task.assignedTo?._id || task.assignedTo) === String(user._id) ||
      String(task.createdBy?._id || task.createdBy) === String(user._id)
    );
  }
  const ids = (await getScopeUserIds(user)).map(String);
  const assignee = String(task.assignedTo?._id || task.assignedTo);
  const creator = String(task.createdBy?._id || task.createdBy);
  return ids.includes(assignee) || ids.includes(creator);
}
