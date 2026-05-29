import app from "./app.js";
import http from 'http'
import { db } from "./config/db.js";
import {Server} from 'socket.io'
import { setupSocket } from "./socket/socket.js";

const port = process.env.PORT || 3000


// create server:
const server = http.createServer(app)

//socket server:
const io = new Server(server,{
    cors:{
        origin:["http://localhost:5173", "http://localhost:5174"],
        credentials:true
    }
})

//setupSocket:
setupSocket(io)

//db:
db()

server.listen(port,()=>{
    console.log(`local host running at http://localhost:${port}` )
})
