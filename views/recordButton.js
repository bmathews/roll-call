const h = require('inferno-hyperscript')
const send = require('../store').send

function handleRecordClick () {
  send('toggleRecording')
}

function recordButton (props) {
  return (
    h('button.ui.compact.labeled.icon.button', { onClick: handleRecordClick }, [
      h('i.unmute.icon'),
      h('span', 'Record')
    ])
  )
}

module.exports = recordButton
