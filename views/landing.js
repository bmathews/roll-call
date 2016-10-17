const h = require('inferno-hyperscript')
const send = require('../store').send

const getRandom = () => Math.random().toString(36).substring(7)

function handleJoinClick () {
  send('joinRoom', 'party')
}

function handleCreateClick () {
  send('joinRoom', getRandom())
}

function Landing () {
  return (
    h('.join-container', [
      h('.ui.large.buttons', [
        h('button.ui.button', { onClick: handleJoinClick }, 'Join the Party 🎉'),
        h('.or'),
        h('button.ui.button', { onClick: handleCreateClick }, '🚪 Create New Room')
      ])
    ])
  )
}

module.exports = Landing
