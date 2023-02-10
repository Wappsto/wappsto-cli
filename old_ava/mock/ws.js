class WebSocket {
  on(type, func) {
    this[type] = func;
  }
}
module.exports = WebSocket;
