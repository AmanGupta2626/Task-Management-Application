import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function register(req, res, next) {
  try {
    const { username, email, password, role, manager, teamLead } = req.body;

    const data = { username, email, password, role: role || 'Employee' };

    if (data.role === 'TeamLead') {
      if (!manager) {
        return res.status(400).json({ message: 'A manager must be selected for a team lead' });
      }
      data.manager = manager;
    }

    if (data.role === 'Employee' && teamLead) {
      data.teamLead = teamLead;
    }

    const user = await User.create(data);
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function listManagers(req, res, next) {
  try {
    const managers = await User.find({ role: 'Manager' }).select('username email');
    res.json(managers);
  } catch (err) {
    next(err);
  }
}

export async function listTeamLeads(req, res, next) {
  try {
    const teamLeads = await User.find({ role: 'TeamLead' }).select('username email manager');
    res.json(teamLeads);
  } catch (err) {
    next(err);
  }
}
