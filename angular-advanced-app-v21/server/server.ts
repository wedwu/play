import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { loginUser } from './login.route';
import { getTasks } from './get-tasks.route';
import { createTask } from './save-task.route';
import { getUsers } from './get-users.route';
import { createUser, updateUser } from './save-user.route';

const app: Application = express();

app.use(bodyParser.json());
app.use(cors({ origin: true }));

app.route('/api/login').post(loginUser);
app.route('/api/tasks').get(getTasks).post(createTask);
app.route('/api/users').get(getUsers).post(createUser);
app.route('/api/users/:id').put(updateUser);

const httpServer = app.listen(9000, () => {
    const addr = httpServer.address();
    const port = typeof addr === 'object' && addr !== null ? addr.port : 9000;
    console.log('HTTP REST API Server running at http://localhost:' + port);
});
