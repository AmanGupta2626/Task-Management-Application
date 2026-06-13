import Task from '../models/Task.js';
import {
  buildTaskVisibilityFilter,
  canAssignTo,
  canAccessTask,
} from '../services/scope.js';
import { emitTaskEvent } from '../socket.js';

const populateFields = [
  { path: 'createdBy', select: 'username email role' },
  { path: 'assignedTo', select: 'username email role' },
];

export async function getTasks(req, res, next) {
  try {
    const filter = await buildTaskVisibilityFilter(req.user);

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter).populate(populateFields).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).populate(populateFields);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, description, status } = req.body;
    let assignedTo = req.body.assignedTo;

    if (req.user.role === 'Employee' || !assignedTo) {
      assignedTo = req.user._id;
    }

    if (!(await canAssignTo(req.user, assignedTo))) {
      return res.status(403).json({ message: 'You cannot assign a task to this user' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      createdBy: req.user._id,
      assignedTo,
    });

    await task.populate(populateFields);
    emitTaskEvent('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).populate(populateFields);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: 'You cannot modify this task' });
    }

    const { title, description, status, assignedTo } = req.body;

    if (assignedTo && String(assignedTo) !== String(task.assignedTo._id)) {
      if (!(await canAssignTo(req.user, assignedTo))) {
        return res.status(403).json({ message: 'You cannot assign a task to this user' });
      }
      task.assignedTo = assignedTo;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    await task.save();
    await task.populate(populateFields);
    emitTaskEvent('task:updated', task);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).populate(populateFields);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: 'You cannot delete this task' });
    }

    await task.deleteOne();
    emitTaskEvent('task:deleted', task);
    res.json({ message: 'Task deleted', id: task._id });
  } catch (err) {
    next(err);
  }
}
