import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import aptitudeRoutes from './routes/aptitudeRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Verta API is live'
    });
});

// Aptitude quiz routes
app.use('/api/aptitude', aptitudeRoutes);

// Course and university routes
app.use('/api/courses', courseRoutes);

// Olu chatbot route
app.use('/api/chat', chatRoutes);

export default app;