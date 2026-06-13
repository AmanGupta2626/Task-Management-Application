import User from '../models/User.js';
import { getScopeUserIds, getAssignableUsers } from '../services/scope.js';

export async function getUsers(req, res, next) {
  try {
    if (req.user.role === 'Manager') {
      const users = await User.find({ _id: { $ne: req.user._id } })
        .select('username email role manager teamLead')
        .sort({ role: 1, username: 1 });
      return res.json(users);
    }

    if (req.user.role === 'TeamLead') {
      const ids = await getScopeUserIds(req.user);
      const users = await User.find({ _id: { $in: ids } })
        .select('username email role manager teamLead')
        .sort({ username: 1 });
      return res.json(users);
    }

    return res.json([req.user]);
  } catch (err) {
    next(err);
  }
}

export async function getAssignable(req, res, next) {
  try {
    const users = await getAssignableUsers(req.user);
    res.json(users);
  } catch (err) {
    next(err);
  }
}
