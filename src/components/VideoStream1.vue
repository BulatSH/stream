<script lang="ts" setup>
import { onMounted, useTemplateRef } from "vue";

const videoPlayer = useTemplateRef('videoPlayer')

const startVideoStream = async (): Promise<void> => {
  try {
    if (!videoPlayer.value) return;

    // 1. Подключаемся к WebSocket серверу
    const ws = new WebSocket("ws://194.87.238.74:8000/ws");

    // Ожидаем подключения WebSocket
    await new Promise((resolve, reject) => {
      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        resolve(true);
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        reject(new Error(`WebSocket failed: ${error}`));
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.reason);
        reject(new Error(`Connection closed: ${event.reason}`));
      };

      setTimeout(() => {
        reject(new Error("Connection timeout (5s)"));
      }, 5000);
    });

    // 2. Получаем локальный поток
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // 3. Создаем PeerConnection с конфигурацией ICE
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
        // При необходимости добавить TURN сервер
      ]
    });

    // 4. Настройка обработчиков ICE кандидатов
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "ice_candidate",
          candidate: event.candidate,
          room_id: "default_room" // Идентификатор комнаты
        }));
      }
    };

    // 5. Обработка входящих потоков от сервера
    peerConnection.ontrack = (event) => {
      if (!videoPlayer.value) return;
      if (event.streams && event.streams[0]) {
        videoPlayer.value.srcObject = event.streams[0];
      }
    };

    // 6. Добавляем локальные треки в соединение
    localStream.getTracks().forEach(track =>
      peerConnection.addTrack(track, localStream)
    );

    // 7. Отправка локального видео в элемент video
    videoPlayer.value.srcObject = localStream;

    // 8. Создаем и отправляем offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

   if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "join",
        offer: offer,
        room_id: "default_room"
      }));
    } else {
      console.error("WebSocket is not open");
      return;
    }

    // 9. Обработка сообщений от сервера
    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "answer") {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.answer)
        );
      }

      if (message.type === "ice_candidate") {
        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          );
        } catch (e) {
          console.error("Error adding ICE candidate:", e);
        }
      }
    };

  } catch (err) {
    console.error("Video stream error:", err);
  }
};

onMounted(() => {
  startVideoStream()
})
</script>

<template>
<!--  <q-video src="test"></q-video>-->
<div style="max-width: 300px; margin: 0 auto;">
  <video ref="videoPlayer" controls></video>
</div>
</template>

<style>
#video-container {
    position: relative;
    width: 100%;
    background: #000;
    margin: 20px 0;
    border-radius: 8px;
    overflow: hidden;
}
video {
    width: 100%;
    display: block;
}
.controls {
    display: flex;
    gap: 10px;
    margin: 15px 0;
    flex-wrap: wrap;
}
button {
    background: #007AFF;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    flex: 1;
    min-width: 120px;
    transition: background 0.2s;
}
button:hover {
    background: #0066CC;
}
button:disabled {
    background: #CCCCCC;
    cursor: not-allowed;
}
.status {
    padding: 12px;
    border-radius: 8px;
    margin: 15px 0;
}
.supported {
    background: #D5F5E3;
    color: #117A65;
}
.unsupported {
    background: #FADBD8;
    color: #C0392B;
}
.info {
    background: #D6EAF8;
    color: #2874A6;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
}
</style>
