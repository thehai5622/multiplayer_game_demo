addEventListener('click', (event) => {
  const playerPosition = {
    x: frontEndplayers[socket.id].x,
    y: frontEndplayers[socket.id].y,
  }

  const angle = Math.atan2(
    (event.clientY * window.devicePixelRatio) - playerPosition.y,
    (event.clientX * window.devicePixelRatio) - playerPosition.x
  )

  // const velocity = {
  //   x: Math.cos(angle) * 5,
  //   y: Math.sin(angle) * 5
  // }

  socket.emit('shoot', {
    x: playerPosition.x,
    y: playerPosition.y,
    angle: angle
  })

  // frontEndProjectiles.push(
  //   new Projectile({
  //     x: playerPosition.x,
  //     y: playerPosition.y,
  //     radius: 5,
  //     color: 'white',
  //     velocity: velocity
  //   })
  // )

  console.log(frontEndProjectiles);
})
