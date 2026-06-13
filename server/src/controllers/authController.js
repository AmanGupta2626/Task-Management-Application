import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function cookieOptions(req) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}

function sendAuth(req, res, user, status = 200) {
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions(req));
  res.status(status).json({ user });
}

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const user = await User.create({ username, email, password, role: 'Employee' });
    sendAuth(req, res, user, 201);
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

    sendAuth(req, res, user);
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(req), maxAge: undefined });
  res.json({ message: 'Logged out' });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function listManagers(req, res, next) {
  try {
    const managers = await User.find({ role: 'Manager' }).select('username');
    res.json(managers);
  } catch (err) {
    next(err);
  }
}

export async function listTeamLeads(req, res, next) {
  try {
    const teamLeads = await User.find({ role: 'TeamLead' }).select('username');
    res.json(teamLeads);
  } catch (err) {
    next(err);
  }
}
