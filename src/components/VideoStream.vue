<script lang="ts" setup>
import { onMounted, useTemplateRef } from "vue";

const videoPlayer = useTemplateRef('videoPlayer')

const startVideoStream = async (): Promise<void> => {
  try {
    if (!videoPlayer.value) return

    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    const peerConnection = new RTCPeerConnection()

    videoPlayer.value.srcObject = localStream

    console.log(videoPlayer.value.disablePictureInPicture = true)

    // await videoPlayer.value.requestPictureInPicture()

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream))

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    console.log(offer)

    // sendToServer(offer) - кидаем на бэк
  } catch (err) {
    console.log(err)
  }
}

onMounted(() => {
  startVideoStream()

  const video = document.getElementById('video');
  const pipButton = document.getElementById('pipButton');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const playButton = document.getElementById('playButton');
  const statusEl = document.getElementById('status');
  const videoContainer = document.getElementById('video-container');

  // Определение платформы
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Проверка поддержки PiP
  function checkPiPSupport() {
      // Стандартный API
      if ('pictureInPictureEnabled' in document) {
          return true;
      }
      // WebKit API (Safari)
      if (video.webkitSupportsPresentationMode &&
          typeof video.webkitSetPresentationMode === 'function') {
          return true;
      }
      return false;
  }

  // Универсальная функция PiP
  async function togglePiP() {
      try {
          // Стандартный API (Android Chrome)
          if ('pictureInPictureEnabled' in document) {
              if (document.pictureInPictureElement) {
                  await document.exitPictureInPicture();
              } else {
                  if (video.paused) await video.play();
                  await video.requestPictureInPicture();
              }
          }
          // WebKit API (iOS Safari)
          else if (video.webkitSupportsPresentationMode) {
              const isPiP = video.webkitPresentationMode === 'picture-in-picture';
              await video.webkitSetPresentationMode(isPiP ? 'inline' : 'picture-in-picture');
          }
      } catch (error) {
          updateStatus(`Ошибка PiP: ${error.message}`, true);
          console.error('PiP error:', error);
      }
  }

  // Управление полноэкранным режимом
  async function toggleFullscreen() {
      try {
          if (!document.fullscreenElement) {
              await videoContainer.requestFullscreen();
          } else {
              await document.exitFullscreen();
          }
      } catch (error) {
          console.error('Fullscreen error:', error);
      }
  }

  // Обновление статуса
  function updateStatus(message, isError = false) {
      statusEl.textContent = message;
      statusEl.className = isError ? 'status unsupported' : 'status supported';
  }

  // Инициализация
  function init() {
      const pipSupported = checkPiPSupport();

      if (pipSupported) {
          updateStatus("PiP поддерживается в вашем браузере!");

          // Настройка кнопок
          pipButton.addEventListener('click', togglePiP);
          playButton.addEventListener('click', () => video.paused ? video.play() : video.pause());

          // Для iOS добавляем кнопку полноэкранного режима
          if (isIOS) {
              fullscreenButton.style.display = 'inline-block';
              fullscreenButton.addEventListener('click', () => {
                  if (video.webkitDisplayingFullscreen) {
                      video.webkitExitFullscreen();
                  } else {
                      video.webkitEnterFullscreen();
                  }
              });
          }
          // Для Android добавляем обработчик автоматического PiP
          else if (isAndroid) {
              document.addEventListener('visibilitychange', async () => {
                  if (document.visibilityState === 'hidden' &&
                      !video.paused &&
                      !document.pictureInPictureElement) {
                      try {
                          await togglePiP();
                      } catch (error) {
                          console.log('Автоматический PiP не сработал:', error);
                      }
                  }
              });
          }

          // Обновление интерфейса
          video.addEventListener('play', () => {
              playButton.textContent = '⏸ Пауза';
          });

          video.addEventListener('pause', () => {
              playButton.textContent = '▶ Воспроизвести';
          });

          video.addEventListener('enterpictureinpicture', () => {
              pipButton.textContent = 'Выйти из PiP';
              updateStatus("PiP активирован!");
          });

          video.addEventListener('leavepictureinpicture', () => {
              pipButton.textContent = 'Включить PiP';
              updateStatus("PiP отключен");
          });

          // Для Safari
          video.addEventListener('webkitpresentationmodechanged', () => {
              if (video.webkitPresentationMode === 'picture-in-picture') {
                  pipButton.textContent = 'Выйти из PiP';
                  updateStatus("PiP активирован!");
              } else {
                  pipButton.textContent = 'Включить PiP';
                  updateStatus("PiP отключен");
              }
          });
      } else {
          updateStatus("PiP не поддерживается в вашем браузере", true);
          pipButton.disabled = true;
      }
  }

  // Запуск при полной загрузке страницы
  window.addEventListener('load', init);
})
</script>

<template>
<!--  <q-video src="test"></q-video>-->
<div style="max-width: 300px; margin: 0 auto;">
  <video ref="videoPlayer" controls></video>
  <div class="info">
      <p>Этот плеер поддерживает Picture-in-Picture режим на:</p>
      <ul>
          <li>Android (Chrome 70+)</li>
          <li>iOS (Safari 14+)</li>
      </ul>
  </div>

  <div id="video-container">
      <video id="video" controls playsinline webkit-playsinline x-webkit-airplay="allow">
          <source src="../assets/videos/test.mp4" type="video/mp4">
          Ваш браузер не поддерживает HTML5 видео.
      </video>
  </div>

  <div class="controls">
      <button id="pipButton">Включить PiP</button>
      <button id="fullscreenButton">Полный экран</button>
      <button id="playButton">▶️ Воспроизвести</button>
  </div>

  <div id="status" class="status unsupported">Проверяем поддержку PiP...</div>
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
