import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';

const PORT = process.env.PORT || 7735;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});