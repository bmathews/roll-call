const h = require('inferno-hyperscript')
const InfernoDOM = require('inferno-dom')

const connect = require('./store').connect

const Landing = require('./views/landing')
const Room = require('./views/room')

const App = connect(function (props) {
  if (props.location.indexOf('?room') !== -1) {
    return h(Room, props)
  }
  return h(Landing)
}, state => state)

InfernoDOM.render(h(App), document.body)
