import { Request, Response } from 'express';
import { TASKS, TaskRecord } from './tasks-db';

export const createTask = (req: Request, res: Response): void => {
  const dto: TaskRecord = req.body;
  const id = dto.id || `task-${Date.now()}`;
  const now = new Date().toISOString();

  /*
    console.log("ERROR saving tasks!");
    res.sendStatus(500);
    return;
  */

  const record: TaskRecord = {
    ...dto,
    id,
    status: dto.status || 'active',
    createdAt: dto.createdAt || now,
    updatedAt: now,
  };

  TASKS[id] = record;

  console.log('Created task', id, record.title);
  res.status(201).json(record);
};
