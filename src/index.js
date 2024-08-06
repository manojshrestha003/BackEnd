import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

// Load environment variables
dotenv.config({ path: './env' });

const startServer = async () => {
    try {
        await connectDB();
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port: ${process.env.PORT || 8000}`);
        });
    } catch (err) {
        console.error('Server startup failed:', err);
    }
};

startServer();
