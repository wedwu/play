import { Request, Response } from 'express';
import { TASKS } from './tasks-db';

export const getTasks = (_req: Request, res: Response): void => {
  res.json(Object.values(TASKS));
};
