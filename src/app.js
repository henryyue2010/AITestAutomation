import express from 'express';
const app = express();
import routes from './routes/index.js';

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// middleware

export default app;