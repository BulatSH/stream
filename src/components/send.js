const WS_URL = "http://194.87.238.74:8000/";
const room_id = "test_room";

// Подключение к серверу
const ws = new WebSocket(WS_URL);

// Создание PeerConnection с STUN
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// Отправка offer при подключении
ws.onopen = async () => {
  const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  ws.send(JSON.stringify({
    type: "join",
    offer: offer,
    room_id: room_id
  }));
};

// Получение answer от сервера
ws.onmessage = async (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "answer") {
    await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
  } else if (msg.type === "ice_candidate") {
    await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
  }
};