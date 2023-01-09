import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('public'))

io.on('connection', (socket) => {
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

  socket.on('disconnect', () => {
    socket.broadcast.emit('left', socket.id)
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => console.log(`Listening on port ${port}`))
