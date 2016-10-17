const h = require('inferno-hyperscript')
const remoteAudio = require('./remoteAudio')
const recordButton = require('./recordButton')
const settings = require('./settings')

function room (props) {
  return (
    h('.ui', [
      h(settings, props),
      h(recordButton, props.recording),
      h('.ui.main.text.container', [
        h('.ui.special.cards', props.users.map(user => h(remoteAudio, { user: user })))
      ])
    ])
  )
}

module.exports = room
