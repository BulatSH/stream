<script lang="ts" setup>
import { CapacitorVideoPlayer } from 'capacitor-video-player';
import {onMounted, ref, useTemplateRef} from 'vue';

const videoStatus = ref('');

const videoUrl = '@/assets/videos/test.mp4'

// const openVideo = async () => {
//   try {
//     videoStatus.value = 'Загрузка...';
//
//     console.log('Проверка методов плагина:', {
//       initPlayer: typeof CapacitorVideoPlayer.initPlayer,
//     });
//
//     await CapacitorVideoPlayer.stopAllPlayers();
//
//     const result = await CapacitorVideoPlayer.initPlayer({
//       mode: '',
//       url: videoUrl,
//       playerId: 'video-container',
//       componentTag: 'div',
//       pipEnabled: true,
//       exitOnEnd: false,
//       width: 300,
//       height: 200,
//     });
//
//     console.log('Plugin available:', CapacitorVideoPlayer)
//
//     console.log('Результат инициализации:', result);
//     videoStatus.value = 'Видео должно быть видно!';
//
//   } catch (error) {
//     console.error('Полная ошибка:', error);
//     videoStatus.value = `Ошибка: ${error.message}`;
//   }
// };

const isInPiP = ref(false)
const pipSupported = ref(false)
const videoPlayer = useTemplateRef('videoPlayer')

const checkPiPSupport = () => {
  pipSupported.value = document.pictureInPictureEnabled || 'documentPictureInPictureEnabled' in window;

  console.log(pipSupported.value)
}

const togglePiP = async () =>  {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      isInPiP.value = false;
    } else {
      await videoPlayer.value.requestPictureInPicture();
      isInPiP.value = true;
    }
  } catch (err) {
    console.error("PiP Error:", err);
  }
}

onMounted(() => {
  checkPiPSupport()
})
</script>
<template>
<!--  <q-btn-->
<!--    @click="openVideo"-->
<!--    label="Запустить видео с PiP"-->
<!--    style="margin-top: 200px"-->
<!--  />-->
<!--  <div id="video-container" style="width: 300px; height: 200px; margin: 20px auto;"></div>-->
<!--  <div>{{ videoStatus }}</div>-->

<video
    ref="videoPlayer"
    controls
    crossorigin="anonymous"
    playsinline
    webkit-playsinline
    disablePictureInPicture="false"
    style="max-width: 300px"
>
  <source src="../assets/videos/test.mp4" type="video/mp4">
</video>
<button @click="togglePiP">Toggle Picture-in-Picture</button>
<p style="color: red;">
  {{ pipSupported }}
</p>
</template>