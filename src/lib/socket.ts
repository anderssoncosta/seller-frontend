import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  const token = localStorage.getItem('accessToken') || ''

  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    })
  } else {
    // update token in case it was refreshed
    socket.auth = { token }
  }

  return socket
}

export function connectSocket(organizationId?: string) {
  const s = getSocket()
  if (!s.connected) s.connect()
  if (organizationId) {
    s.emit('join-organization', { organizationId })
  }
  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
