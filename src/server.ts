import express from 'express'
import http from 'http'
import path from 'path'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  pingInterval: 1000 * 60,
  pingTimeout: 10000,
})

app.use(express.static(path.join(__dirname, '..', 'public')))

io.on('connection', (socket) => {
  const ping = setInterval(() => {
    socket.emit('ping')
  }, 1000)
  
  socket.on('user-join', () => {
    socket.broadcast.emit('join', socket.id)
  })

  socket.on('offer', (userId, offer) => {
    socket.to(userId).emit('offer', socket.id, offer)
  })

  socket.on('answer', (userId, answer) => {
    socket.to(userId).emit('answer', socket.id, answer)
  })

  socket.on('candidate', (userId, candidate) => {
    socket.to(userId).emit('candidate', socket.id, candidate)
  })
  
  socket.on('pong', () => {
    console.log('ping')
  })

  socket.on('disconnect', (reason) => {
    clearInterval(ping)
    console.log('User disconnected, reason: ' + reason)
    socket.broadcast.emit('left', socket.id)
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => console.log(`Listening on port ${port}`))
