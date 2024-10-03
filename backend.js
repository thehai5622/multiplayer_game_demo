const express = require('express')
const app = express()

// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}
const backEndProjectiles = {}

const SPEED = 5
const RADIUS = 10
const PROJECTILE_RADIUS = 5
let projectitiles = 0

io.on('connection', (socket) => {
  io.emit('updatePlayers', backEndPlayers)

  socket.on('shoot', ({ x, y, angle }) => {
    projectitiles++

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectitiles] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }

    console.log(backEndProjectiles)
  })

  socket.on('initGame', ({ username, width, height }) => {
    backEndPlayers[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username: username
    }

    // where we init our canvas
    backEndPlayers[socket.id].canvas = {
      width,
      height
    }

    backEndPlayers[socket.id].radius = RADIUS

    // if (devicePixelRatio > 1) {
    //   backEndPlayers[socket.id].radius = 2 * RADIUS
    // }
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const backEndPlayer = backEndPlayers[socket.id]

    if (!backEndPlayers[socket.id]) {
      return
    }

    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch (keycode) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= SPEED
        break
      case 'KeyA':
        backEndPlayers[socket.id].x -= SPEED
        break
      case 'KeyS':
        backEndPlayers[socket.id].y += SPEED
        break
      case 'KeyD':
        backEndPlayers[socket.id].x += SPEED
        break
    }

    // restrict player to map boundaries
    const playerSides = {
      left: backEndPlayer.x - backEndPlayer.radius,
      right: backEndPlayer.x + backEndPlayer.radius,
      top: backEndPlayer.y - backEndPlayer.radius,
      bottom: backEndPlayer.y + backEndPlayer.radius
    }

    if (playerSides.left < 0) {
      backEndPlayer.x = backEndPlayer.radius
    }
    if (playerSides.right > backEndPlayer.canvas.width) {
      backEndPlayer.x = backEndPlayer.canvas.width - backEndPlayer.radius
    }
    if (playerSides.top < 0) {
      backEndPlayer.y = backEndPlayer.radius
    }
    if (playerSides.bottom > backEndPlayer.canvas.height) {
      backEndPlayer.y = backEndPlayer.canvas.height - backEndPlayer.radius
    }
  })
})

// backend ticker
setInterval(() => {
  // update projectiles positions
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    if (
      backEndProjectiles[id].x - PROJECTILE_RADIUS >=
        backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
      backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||
      backEndProjectiles[id].y - PROJECTILE_RADIUS >=
        backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
      backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0
    ) {
      delete backEndProjectiles[id]
      continue
    }

    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId]

      const DISTANCE = Math.hypot(
        backEndProjectiles[id]?.x - backEndPlayer.x,
        backEndProjectiles[id]?.y - backEndPlayer.y
      )

      // collision detection
      if (
        DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
        backEndProjectiles[id]?.playerId !== playerId
      ) {
        backEndPlayers[backEndProjectiles[id].playerId].score++
        delete backEndProjectiles[id]
        delete backEndPlayers[playerId]
        break
      }
    }
  }

  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log('server loaded')
