import {
  detectSingleFace,
  nets,
  fetchNetWeights,
  TinyFaceDetectorOptions,
} from 'face-api.js';
import { Object3D } from 'three';
import {
  Scene,
  Floor,
  Voxels,
  UI,
} from 'vrengine';
import { Sign, Walls } from '@/meshes';
import TinyFaceDetectorModel from '@/weights/tiny_face_detector_model.weights';
import DarkAmbient from '@/sounds/dark.ogg';

class Level1 extends Scene {
  constructor(args) {
    super(args);
    const { engine } = args;

    engine.setAmbientSounds([DarkAmbient]);
    engine.setBackgroundColor(0x111122);

    engine.camera.fov = 75;
    engine.camera.updateProjectionMatrix();
    engine.camera.lookAt(0, 1.8, -1);

    // Spawn some huge walls
    const walls = new Walls();
    this.add(walls);

    // Spawn a platform
    {
      const size = 16;
      const platform = new Voxels({
        generator: ({ y }) => {
          if (
            y === 0
          ) {
            const light = (1 - Math.random() * 0.6) * 0x1A;
            return (
              (0x03 << 24)
              | (Math.floor(light * 0.5) << 16)
              | (Math.floor(light * 0.5) << 8)
              | light
            );
          }
          return 0x00;
        },
        size,
        texture: this.voxelsTexture,
      });
      platform.position.set(size * -0.5, -1, size * -0.5);
      this.add(platform);
      this.intersects.push(platform);

      const ground = new Floor({
        width: size,
        height: size,
      });
      ground.material.visible = false;
      ground.position.y += 0.001;
      this.add(ground);
      this.intersects.push(ground);
    }

    // Spawn a sign
    const sign = new Sign({
      buttons: [
        {
          label: 'Big brotha',
          x: 128 - 110,
          y: 128 - 25,
          width: 220,
          height: 50,
          onPointer: () => {},
        },
      ],
      graphics: [
        ({ ctx }) => {
          for (let i = 0; i < 128; i += 1) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const l = (Math.random() * 0.3 + 0.5) * 0x100;
            ctx.fillStyle = `rgba(${l}, ${l}, ${l}, .5)`;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 5 + 1, 0, Math.PI * 2);
            ctx.fill();
          }
        },
      ],
      styles: {
        button: {
          background: '#393',
        },
      },
    });
    sign.position.set(2.5, -0.25, -2.5);
    sign.lookAt(0, 1.25, 0);
    this.add(sign);
    this.intersects.push(...sign.intersects);

    // Spawn a bunch of screens
    const displays = [];
    for (let y = 0; y < 6; y += 1) {
      const distance = 7 + y * 0.5;
      for (let x = 0; x < 10; x += 1) {
        const pivot = new Object3D();
        const display = new UI({
          width: 1,
          height: 1,
        });
        const s = 0.8 + Math.random() * 0.15;
        display.scale.set(s, s, s);
        displays.push(display);
        const stepY = Math.random() + 0.5;
        display.onBeforeRender = ({ animation: { time } }) => {
          display.rotation.y = Math.sin(time * stepY) * 0.25;
        };
        pivot.add(display);
        const yaw = Math.PI + ((x - 4.5) / 11) * Math.PI * 0.5;
        const pitch = ((y + 1.5) / 7) * Math.PI * 0.25;
        pivot.position.set(
          distance * Math.sin(yaw) * Math.cos(pitch),
          distance * Math.sin(pitch),
          distance * Math.cos(yaw) * Math.cos(pitch)
        );
        pivot.lookAt(0, 3, 0);
        this.add(pivot);
      }
    }
    displays.sort(() => Math.random() - 0.5);

    let displayIndex = 0;
    const video = document.createElement('video');
    const options = new TinyFaceDetectorOptions();
    const detectFace = () => {
      detectSingleFace(video, options)
        .then((result) => {
          if (result) {
            const { box } = result;
            const display = displays[displayIndex];
            displayIndex += 1;
            if (displayIndex >= displays.length) {
              displays.sort(() => Math.random() - 0.5);
              displayIndex = 0;
            }
            const sx = Math.max(box.x - box.width * 0.25, 0);
            const sy = Math.max(box.y - box.height * 0.25, 0);
            const sw = Math.min(box.width * 1.5, video.videoHeight - sx);
            const sh = Math.min(box.height * 1.5, video.videoHeight - sy);
            let x = 0;
            let y = 0;
            let w = display.renderer.width;
            let h = display.renderer.height;
            if (sw < sh) {
              h = sh * w / sw;
              y = display.renderer.height * 0.5 - h * 0.5;
            } else {
              w = sw * h / sh;
              x = display.renderer.width * 0.5 - w * 0.5;
            }
            display.context.drawImage(
              video,
              sx, sy, sw, sh,
              x, y, w, h
            );
            display.texture.needsUpdate = true;
          }
          this.timeout = setTimeout(detectFace);
        });
    };
    video.onloadedmetadata = detectFace;

    fetchNetWeights(TinyFaceDetectorModel)
      .then((model) => {
        nets.tinyFaceDetector.load(model).then(() => {
          navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then((stream) => {
              video.srcObject = stream;
              video.play();
              this.stream = stream;
            });
        });
      });
  }

  dispose() {
    super.dispose();
    if (this.stream) {
      this.stream.getTracks().forEach(track => (
        track.stop()
      ));
    }
    clearTimeout(this.timeout);
  }
}

export default Level1;
