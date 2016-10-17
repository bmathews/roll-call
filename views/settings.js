const h = require('inferno-hyperscript')
const createClass = require('inferno-create-class')
const send = require('../store').send

function handleSettingsClick (e) {
  e.stopPropagation()
  send('toggleSettings')
}

function handleChangeName (e) {
  send('setName', e.target.value)
}

function handleChangeInput (e) {
  send('setInputDevice', e.target.value)
}

function stop (e) {
  e.stopPropagation()
}

function hideSettings () {
  send('toggleSettings')
}

const Settings = createClass({
  componentDidUpdate: function () {
    if (this.props.showSettings) {
      document.addEventListener('click', hideSettings)
    } else {
      document.removeEventListener('click', hideSettings)
    }
  },

  render: function () {
    const props = this.props
    return (
      h(`.ui.compact.icon.button.left.pointing.dropdown${props.showSettings ? '.visible.active' : ''}`, { onClick: handleSettingsClick }, [
        h('i.settings.icon'),
        h(`.menu.transition${props.showSettings ? '.visible' : ''}`, { onClick: stop, onKeyPress: stop, style: { width: 200 } }, [
          h('.ui.form', { style: { padding: 20 } }, [
            h('.field', [
              h('label', 'Username'),
              h('input', { type: 'text', placeholder: 'Enter your name', value: props.username, onChange: handleChangeName })
            ]),
            h('.field', [
              h('label', 'Input device'),
              h('select.ui.dropdown', { onChange: handleChangeInput },
                props.inputDevices.map(device => (
                  h('option', {
                    value: device.deviceId,
                    selected: device.deviceId === props.selectedDeviceId
                  }, device.label)
                ))
              )
            ])
          ])
        ])
      ])
    )
  }
})

module.exports = Settings
