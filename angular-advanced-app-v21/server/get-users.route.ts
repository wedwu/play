import { Request, Response } from 'express';
import { USERS } from './users-db';

export const getUsers = (_req: Request, res: Response): void => {

  /*
    console.log("ERROR loading users!");
    res.status(500).json({message: 'random error occurred.'});
    return;
 */

  setTimeout(() => {
    res.json(Object.values(USERS));
  }, 1500);
};
