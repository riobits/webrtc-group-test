let localStream
const users = {}

const socket = io()

const servers = {
  iceServers: [
    {
      urls: 'stun:relay.metered.ca:80',
    },
    {
      urls: 'turn:relay.metered.ca:80',
      username: '294e14855bf144996d71026d',
      credential: 'iOlLmEW1ETyCNwdX',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: '294e14855bf144996d71026d',
      credential: 'iOlLmEW1ETyCNwdX',
    },
    {
      urls: 'turn:relay.metered.ca:443?transport=tcp',
      username: '294e14855bf144996d71026d',
      credential: 'iOlLmEW1ETyCNwdX',
    },
  ],
}

const addVideoStream = (userId) => {
  const remoteStream = new MediaStream()

  const videos = document.getElementById('videos')
  const video = document.createElement('video')

  video.id = userId
  video.autoplay = true
  video.playsInline = true
  video.srcObject = remoteStream

  videos.appendChild(video)

  return remoteStream
}

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })

  document.getElementById('camera-stream').srcObject = localStream

  socket.emit('user-join')
  socket.on('join', createOffer)
  socket.on('offer', createAnswer)
  socket.on('answer', addAnswer)
  socket.on('left', removeUser)
}

const createOffer = async (userId) => {
  users[userId] = { mypc: new RTCPeerConnection(servers) }

  const remoteStream = addVideoStream(userId)

  localStream.getTracks().forEach((track) => {
    users[userId].mypc.addTrack(track, localStream)
  })

  users[userId].mypc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  users[userId].mypc.onicecandidate = () => {
    if (users[userId].mypc.iceGatheringState === 'complete') {
      socket.emit('offer', userId, users[userId].mypc.localDescription)
    }
  }

  const offer = await users[userId].mypc.createOffer()
  await users[userId].mypc.setLocalDescription(offer)
}

const createAnswer = async (userId, offer) => {
  users[userId] = { ...users[userId], pc: new RTCPeerConnection(servers) }

  const remoteStream = addVideoStream(userId)

  localStream.getTracks().forEach((track) => {
    users[userId].pc.addTrack(track, localStream)
  })

  users[userId].pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  users[userId].pc.onicecandidate = () => {
    if (users[userId].pc.iceGatheringState === 'complete') {
      socket.emit('answer', userId, users[userId].pc.localDescription)
    }
  }

  await users[userId].pc.setRemoteDescription(offer)

  const answer = await users[userId].pc.createAnswer()
  await users[userId].pc.setLocalDescription(answer)
}

const addAnswer = async (userId, answer) => {
  if (!users[userId].mypc.currentRemoteDescription) {
    users[userId].mypc.setRemoteDescription(answer)
  }
}

const removeUser = (userId) => {
  const video = document.getElementById(userId)

  if (video) {
    video.remove()
  }

  delete users[userId]
}

init()
