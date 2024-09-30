const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndplayers = {}

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]

    if (!frontEndplayers[id]) {
      frontEndplayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
      })
    } else {
      // if a player already exists
      frontEndplayers[id].x = backEndPlayer.x
      frontEndplayers[id].y = backEndPlayer.y
    }

    for (const id in frontEndplayers) {
      if (!backEndPlayers[id]) {
        delete frontEndplayers[id]
      }
    }
  }
})

let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for (const id in frontEndplayers) {
    const frontEndPlayer = frontEndplayers[id]
    frontEndPlayer.draw()
  }
}

animate()

window.addEventListener('keydown', (event) => {
  if (!frontEndplayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      socket.emit('keydown', 'KeyW')
      break;
    case 'KeyA':
      socket.emit('keydown', 'KeyA')
      break;
    case 'KeyS':
      socket.emit('keydown', 'KeyS')
      break;
    case 'KeyD':
      socket.emit('keydown', 'KeyD')
      break;
  }
})