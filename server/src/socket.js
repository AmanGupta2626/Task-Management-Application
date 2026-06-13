import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io = null;

function tokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('token='));
  return entry ? decodeURIComponent(entry.slice('token='.length)) : null;
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = tokenFromCookie(socket.handshake.headers.cookie) || socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

async function recipientsFor(task) {
  const assigneeId = task.assignedTo?._id || task.assignedTo;
  const creatorId = task.createdBy?._id || task.createdBy;
  const recipients = new Set([String(assigneeId), String(creatorId)]);

  const assignee = await User.findById(assigneeId).select('teamLead manager role');
  if (assignee?.teamLead) {
    recipients.add(String(assignee.teamLead));
    const teamLead = await User.findById(assignee.teamLead).select('manager');
    if (teamLead?.manager) recipients.add(String(teamLead.manager));
  }
  if (assignee?.manager) {
    recipients.add(String(assignee.manager));
  }

  return [...recipients];
}

export async function emitTaskEvent(event, task) {
  if (!io) return;
  try {
    const recipients = await recipientsFor(task);
    const payload = task.toJSON ? task.toJSON() : task;
    recipients.forEach((id) => io.to(`user:${id}`).emit(event, payload));
  } catch (err) {
    console.error('Socket emit failed:', err.message);
  }
}
