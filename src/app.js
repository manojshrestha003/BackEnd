import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import userRouter from './routes/user.routes.js';

// Load environment variables
dotenv.config({ path: './env' });

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// Define routes
app.use('/api/v1/users', userRouter);

export { app };
