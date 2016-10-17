const createSwarm = require('killa-beez')
const getUserMedia = require('getusermedia')
const context = new AudioContext()
const waudio = require('waudio')(context)
const xhr = require('xhr')
const EventEmitter = require('events').EventEmitter
const find = require('lodash.find')
const h = require('inferno-hyperscript')
const createClass = require('inferno-create-class')
const qs = require('querystring')

// Services for exchanges.
const signalHost = 'https://signalexchange.now.sh'
const roomHost = 'https://roomexchange.now.sh'

const store = Object.assign({}, EventEmitter.prototype, {
  state: {
    username: 'Me',
    output: waudio(true),
    users: [],
    recording: false,
    recordingStreams: {},
    location: window.location.href.substr(window.location.origin.length),
    showSettings: false,
    inputDevices: []
  },

  actions: {
    setVolume: function (payload, state) {
      let user = find(state.users, u => u.id === payload.userId)
      user.volume = parseFloat(payload.volume, 10)
      if (!user.muted) {
        user.muted = user.volume === 0
        user.stream.volume(user.volume)
      }
    },

    toggleMute: function (payload, state) {
      let user = find(state.users, u => u.id === payload.userId)
      user.muted = !user.muted
      user.stream.volume(user.muted ? 0 : user.volume)
    },

    toggleRecording: function (state) {
      state.recording = !state.recording
    },

    addUser: function (stream, name, state) {
      state.users.push({
        id: stream.publicKey || 0,
        name: name,
        stream: stream,
        analyser: stream.analyser,
        volume: 1,
        muted: false
      })
    },

    removeUser: function (id, state) {
      const index = state.users.indexOf(find(state.users, u => u.id === id))
      state.users.splice(index, 1)
    },

    navigate: function (location, state) {
      if (state.location === location) return
      state.location = location
      window.history.pushState(null, null, location)
    },

    toggleSettings: function (state) {
      state.showSettings = !state.showSettings
      if (state.showSettings) {
        // fetch devices when settings are shown
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          return devices.filter(d => d.kind === 'audioinput')
        }).then((devices) => {
          state.inputDevices = devices
          store.emit('change')
        })
      }
    },

    setInputDevice: function (id, state) {
      state.inputDeviceId = id
      // todo: put in storage
    },

    setName: function (name, state) {
      state.username = name
      if (state.users[0]) {
        state.users[0].name = name
      }
      // todo: put in storage
    },

    joinRoom: function (room, state) {
      send('navigate', `/?room=${room}`)
      state.room = room

      const swarmRoom = `peer-call:${room}`

      let audioopts = {
        echoCancellation: true,
        volume: 0.9,
        deviceId: state.inputDeviceId ? { exact: state.inputDeviceId } : undefined
      }
      let mediaopts = { audio: audioopts, video: false }

      getUserMedia(mediaopts, (err, audioStream) => {
        if (err) return console.error(err)
        if (!audioStream) return console.error('no audio')

        let output = waudio(audioStream.clone())
        createAnalyser(output)

        send('addUser', output, state.username)

        getRtcConfig((err, rtcConfig) => {
          if (err) console.error(err) // non-fatal error

          let swarm = createSwarm(signalHost, {
            stream: output.stream,
            config: rtcConfig
          })

          swarm.joinRoom(roomHost, swarmRoom)

          swarm.on('stream', stream => {
            let audio = waudio(stream)
            createAnalyser(audio)
            audio.connect(state.output)
            stream.peer.audioStream = stream
            audio.publicKey = stream.peer.publicKey

            let remotes = Object.keys(swarm.peers).length
            send('addUser', audio, `Caller (${remotes})`)
          })

          swarm.on('disconnect', pubKey => {
            if (store.state.recordingStreams[pubKey]) {
              store.state.recordingStreams[pubKey].emit('end')
            } else {
              send('removeUser', pubKey)
            }
          })
        })
      })
    }
  }
})

function send (action, data) {
  if (!store.actions[action]) throw new Error('No action: ', action)
  const args = Array.prototype.slice.call(arguments, 1)
  store.actions[action].apply(store, args.concat(store.state))
  console.log(`Action: ${action}:`, data)
  store.emit('change')
}

window.addEventListener('popstate', function () {
  send('navigate', window.location)
})

const opts = qs.parse(window.location.search.slice(1))
if (opts.room) {
  send('joinRoom', opts.room)
}

const connect = function (component, mapStateToProps) {
  return createClass({
    getInitialState: function () { return { storeState: mapStateToProps(store.state) } },
    render: function () {
      return h(component, Object.assign(this.state.storeState, this.props), this.props.children)
    },
    update: function () { this.setState({ storeState: mapStateToProps(store.state) }) },
    componentDidMount: function () { store.addListener('change', this.update) },
    componentWillUnmount: function () { store.removeListener('change', this.update) }
  })
}

module.exports = { store: store, send: send, connect: connect }

function getRtcConfig (cb) {
  let rtcConfig = {"iceServers":[{"url":"stun:23.21.150.121","urls":"stun:23.21.150.121"},{"url":"turn:global.turn.twilio.com:3478?transport=udp","username":"6e415918815a54bc2acc72274e6d1f90515e9cc2b0b132d4fdc5dea2e128c0c8","credential":"oCrzMbpFUc513g6/4SeF9P4wLXsnMRhHLY7QLASf+EQ=","urls":"turn:global.turn.twilio.com:3478?transport=udp"},{"url":"turn:global.turn.twilio.com:3478?transport=tcp","username":"6e415918815a54bc2acc72274e6d1f90515e9cc2b0b132d4fdc5dea2e128c0c8","credential":"oCrzMbpFUc513g6/4SeF9P4wLXsnMRhHLY7QLASf+EQ=","urls":"turn:global.turn.twilio.com:3478?transport=tcp"},{"url":"turn:global.turn.twilio.com:443?transport=tcp","username":"6e415918815a54bc2acc72274e6d1f90515e9cc2b0b132d4fdc5dea2e128c0c8","credential":"oCrzMbpFUc513g6/4SeF9P4wLXsnMRhHLY7QLASf+EQ=","urls":"turn:global.turn.twilio.com:443?transport=tcp"}]}
  cb(null, rtcConfig)
  // xhr({
  //   url: 'https://instant.io/rtcConfig',
  //   timeout: 10000
  // }, function (err, res) {
  //   if (err || res.statusCode !== 200) {
  //     cb(new Error('Could not get WebRTC config from server. Using default (without TURN).'))
  //   } else {
  //     var rtcConfig
  //     try {
  //       rtcConfig = JSON.parse(res.body)
  //     } catch (err) {
  //       return cb(new Error('Got invalid WebRTC config from server: ' + res.body))
  //     }
  //     cb(null, rtcConfig)
  //   }
  // })
}

function createAnalyser (audio) {
  const analyser = context.createAnalyser()
  analyser.fftSize = 256
  audio.connect(analyser)
  audio.analyser = analyser
}
