import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server } from "socket.io"
import { createServer } from "http"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))
app.use((req, res, next) => {
    console.log(`request body: ${req.body}`);
    next()
})

import userRouter from "./routes/user.routes.js"
import addressRouter from "./routes/address.routes.js"
import restaurantRouter from "./routes/restaurant.routes.js"
import menuItemRouter from "./routes/menuItem.routes.js"
import orderRouter from "./routes/order.routes.js"
import deliveryTrackingRouter from "./routes/deliveryTracking.routes.js"
import reviewRouter from "./routes/review.routes.js"

app.use("/api/v1/user", userRouter)
app.use("/api/v1/address", addressRouter)
app.use("/api/v1/restaurant", restaurantRouter)
app.use("/api/v1/menuItem", menuItemRouter)
app.use("/api/v1/order", orderRouter)
app.use("/api/v1/deliveryTracking", deliveryTrackingRouter)
app.use("/api/v1/review", reviewRouter)

const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ['GET', 'POST']
    }
})

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    
    socket.on("joinRoom", (userId) => {
        socket.join(userId)
        console.log(`User ${userId} joined room`);
    })

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    })
})

export {app, httpServer, io}