import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import { app } from './app.js'
import { httpServer } from "./app.js";

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    httpServer.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port: `, process.env.PORT);
    })
})

.catch((err) => {
    console.log(`MongoDB connection error!!!`, err);
})