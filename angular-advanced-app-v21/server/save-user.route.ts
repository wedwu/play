import { Request, Response } from 'express';
import { USERS, UserRecord } from './users-db';

export const createUser = (req: Request, res: Response): void => {
  const dto: UserRecord = req.body;
  const id = dto.id || `user-${Date.now()}`;
  const now = new Date().toISOString();

  /*
    console.log("ERROR saving users!");
    res.sendStatus(500);
    return;
  */
  
  const record: UserRecord = {
    ...dto,
    id,
    status: dto.status || 'active',
    createdAt: dto.createdAt || now,
    updatedAt: now,
  };

  USERS[id] = record;

  console.log('Created user', id, record.firstName, record.lastName);
  res.status(201).json(record);
};

export const updateUser = (req: Request, res: Response): void => {
  const id = req.params['id'];
  const changes = req.body;

  if (!USERS[id]) {
    res.sendStatus(404);
    return;
  }

  USERS[id] = { ...USERS[id], ...changes, updatedAt: new Date().toISOString() };

  console.log('Updated user', id, JSON.stringify(changes));
  res.json(USERS[id]);
};
