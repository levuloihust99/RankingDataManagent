import express from 'express'
import httpServer from 'http'
import { Server as SocketIO } from 'socket.io'

export const app = express()
export const server = httpServer.createServer(app)
// export const io = new SocketIO(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// })