const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

c.scale(devicePixelRatio, devicePixelRatio)

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndplayers = {}
const frontEndProjectiles = {}

socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id]

    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: frontEndplayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity
      })
    } else {
      frontEndProjectiles[id].x += backEndProjectile.velocity.x
      frontEndProjectiles[id].y += backEndProjectile.velocity.y
    }
  }

  for (const id in frontEndProjectiles) {
    if (!backEndProjectiles[id]) {
      delete frontEndProjectiles[id]
    }
  }
})

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]

    if (!frontEndplayers[id]) {
      frontEndplayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
        username: backEndPlayer.username
      })

      document.querySelector('#playerLabels').innerHTML += `
      <div 
        data-id="${id}"
        data-score="${backEndPlayer.score}"
      >
        ${backEndPlayer.username}: ${backEndPlayer.score}
      </div>`
    } else {
      document.querySelector(
        `[data-id="${id}"]`
      ).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`

      document
        .querySelector(`[data-id="${id}"]`)
        .setAttribute('data-score', backEndPlayer.score)

      // sort the players divs
      const parentDiv = document.querySelector(`#playerLabels`)
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      childDivs.sort((a, b) => {
        return (
          Number(b.getAttribute('data-score')) -
          Number(a.getAttribute('data-score'))
        )
      })

      // removes old elements
      childDivs.forEach((childDiv) => {
        parentDiv.removeChild(childDiv)
      })

      // adds sorted elements
      childDivs.forEach((childDiv) => {
        parentDiv.appendChild(childDiv)
      })

      if (id === socket.id) {
        // if a player already exists
        frontEndplayers[id].x = backEndPlayer.x
        frontEndplayers[id].y = backEndPlayer.y

        const lastBackEndInputIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber
        })

        if (lastBackEndInputIndex > -1) {
          playerInputs.splice(0, lastBackEndInputIndex + 1)
        }

        playerInputs.forEach((input) => {
          frontEndplayers[id].x += input.dx
          frontEndplayers[id].y += input.dy
        })
      } else {
        // for all other players
        frontEndplayers[id].x = backEndPlayer.x
        frontEndplayers[id].y = backEndPlayer.y

        gsap.to(frontEndplayers[id], {
          x: backEndPlayer.x,
          y: backEndPlayer.y,
          duration: 0.015,
          ease: 'linear'
        })
      }
    }

    // this is where we delete frontend players
    for (const id in frontEndplayers) {
      if (!backEndPlayers[id]) {
        const divToDelete = document.querySelector(`div[data-id="${id}"]`)
        divToDelete.parentNode.removeChild(divToDelete)

        if (id === socket.id) {
          document.querySelector('#usernameForm').style.display = 'block'
        }

        delete frontEndplayers[id]
      }
    }
  }
})

let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  // c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.clearRect(0, 0, canvas.width, canvas.height)

  for (const id in frontEndplayers) {
    const frontEndPlayer = frontEndplayers[id]
    frontEndPlayer.draw()
  }

  for (const id in frontEndProjectiles) {
    const forntEndProjectile = frontEndProjectiles[id]
    forntEndProjectile.draw()
  }
}

animate()

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

const SPEED = 10
const playerInputs = []
let sequenceNumber = 0
setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: 0, dy: -SPEED })
    frontEndplayers[socket.id].y -= SPEED
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber: sequenceNumber })
  }
  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: -SPEED, dy: 0 })
    frontEndplayers[socket.id].x -= SPEED
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber: sequenceNumber })
  }
  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: 0, dy: +SPEED })
    frontEndplayers[socket.id].y += SPEED
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber: sequenceNumber })
  }
  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber: sequenceNumber, dx: +SPEED, dy: 0 })
    frontEndplayers[socket.id].x += SPEED
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber: sequenceNumber })
  }
}, 15)

window.addEventListener('keydown', (event) => {
  if (!frontEndplayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true
      break
    case 'KeyA':
      keys.a.pressed = true
      break
    case 'KeyS':
      keys.s.pressed = true
      break
    case 'KeyD':
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  if (!frontEndplayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false
      break
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
  }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none'
  socket.emit('initGame', {
    username: document.querySelector('#usernameInput').value,
    width: canvas.width,
    height: canvas.height,
    devicePixelRatio: devicePixelRatio
  })
})
