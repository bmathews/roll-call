const h = require('inferno-hyperscript')
const createClass = require('inferno-create-class')
const send = require('../store').send

module.exports = createClass({
  displayName: 'RemoteAudio',

  componentDidMount: function () {
    this.lastUpdateTime = Date.now()
    this.raf = requestAnimationFrame(this.updateCanvas)
  },

  componentWillUnmount: function () {
    cancelAnimationFrame(this.raf)
  },

  handleMuteChange: function (e) {
    send('toggleMute', { userId: this.props.user.id })
  },

  handleVolumeChange: function (e) {
    send('setVolume', { userId: this.props.user.id, volume: e.target.value })
  },

  updateCanvas: function () {
    const now = Date.now()
    if (now - this.lastUpdateTime > 33.33) {
      const canvas = this.refs.canvas
      const ctx = canvas.getContext('2d')

      const analyser = this.props.user.stream.analyser
      const bufferLength = Math.floor(analyser.frequencyBinCount / 2)
      const dataArray = new Uint8Array(bufferLength)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      const barWidth = Math.floor((canvas.offsetWidth / bufferLength))
      let barHeight
      let x = 0
      let total = 0
      for (let i = 0; i < bufferLength; i++) {
        barHeight = Math.floor(canvas.offsetHeight * (dataArray[i] / 256))
        ctx.fillStyle = 'rgb(66,133,244)'
        ctx.fillRect(x, Math.floor(canvas.offsetHeight - barHeight), barWidth, barHeight)
        x += barWidth + 1
        total += barHeight
      }

      if (total > 1000) {
        canvas.parentNode.classList.add('pulse')
      } else {
        canvas.parentNode.classList.remove('pulse')
      }
      this.lastUpdateTime = now
    }
    this.raf = requestAnimationFrame(this.updateCanvas)
  },

  render: function () {
    const user = this.props.user
    return (
      h('.card', [
        h('canvas.person', { ref: 'canvas', width: '290px', height: '40px' }),
        h('.extra.content', [
          h('.header.person-name', { contentEditable: true }, user.name),
          h('.volume', [
            h('.ui.toggle.checkbox', [
              h('input', { type: 'checkbox', name: 'mute', checked: user.muted, onChange: this.handleMuteChange }),
              h('label', user.muted ? 'Muted' : 'Mute')
            ]),
            h('input', { type: 'range', min: 0, max: 2, step: 0.05, value: user.volume, onChange: this.handleVolumeChange })
          ])
        ])
      ])
    )
  }
})
