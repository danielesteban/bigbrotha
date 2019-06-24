import { Object3D } from 'three';
import {
  Scene,
  Floor,
  Voxels,
  UI,
} from 'vrengine';
import { Sign, Walls } from '@/meshes';
import Face from '@/services/face';
import DarkAmbient from '@/sounds/dark.ogg';

class Level1 extends Scene {
  constructor(args) {
    super(args);
    const { engine } = args;

    engine.setAmbientSounds([DarkAmbient]);
    engine.setBackgroundColor(0x101020);

    engine.camera.fov = 75;
    engine.camera.updateProjectionMatrix();
    engine.camera.lookAt(0, 1.8275, -1);
    engine.camera.room.position.set(0, 0.5, -1);
    // engine.camera.debug.active = true;

    // Spawn some huge walls
    const walls = new Walls();
    this.add(walls);

    // Spawn a platform
    {
      const size = 16;
      const platform = new Voxels({
        generator: ({ x, y, z }) => {
          if (
            y === 0
            || (
              (
                x >= 7 && x <= 8
              )
              && (
                (
                  y < 3 && z >= 6 && z <= 7
                )
                || (
                  y < 2 && z >= 8 && z <= 9
                )
              )
            )
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
      platform.scale.set(1, 0.5, 1);
      platform.position.set(size * -0.5, -1, size * -0.5);
      this.add(platform);
      this.intersects.push(platform);
      [
        {
          position: [0, -0.5, 0],
          width: size,
          height: size,
        },
        {
          position: [0, 0, 1],
          width: 2,
          height: 2,
        },
        {
          position: [0, 0.5, -1],
          width: 2,
          height: 2,
        },
      ].forEach(({ position, width, height }) => {
        const floor = new Floor({
          width,
          height,
        });
        floor.position.set(...position);
        floor.material.visible = false;
        floor.position.y += 0.001;
        this.add(floor);
        this.intersects.push(floor);
      });
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
    this.displays = [];
    for (let y = 0; y < 6; y += 1) {
      const distance = 7 + y * 0.5;
      for (let x = 0; x < 10; x += 1) {
        const pivot = new Object3D();
        const display = new UI({
          labels: [{
            x: 128,
            y: 128,
            color: 'rgba(255, 255, 255, 0.25)',
            text: 'NO SIGNAL',
          }],
          width: 1,
          height: 1,
        });
        const s = 0.8 + Math.random() * 0.15;
        display.scale.set(s, s, s);
        this.displays.push(display);
        const stepX = Math.random() + 0.5;
        const stepY = Math.random() + 0.5;
        display.rotation.order = 'YXZ';
        display.onBeforeRender = ({ animation: { time } }) => {
          display.rotation.x = Math.sin(time * stepX) * 0.2;
          display.rotation.y = Math.sin(time * stepY) * 0.2;
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

    this.displayIndex = 0;
    this.displays.sort(() => Math.random() - 0.5);
    this.renderFace = this.renderFace.bind(this);
    this.renderFace();
  }

  renderFace() {
    const {
      displays,
      displayIndex,
    } = this;
    if (!Face.isReady) {
      this.renderFaceTimeout = setTimeout(this.renderFace);
      return;
    }
    const display = displays[displayIndex];
    this.displayIndex += 1;
    if (this.displayIndex >= displays.length) {
      this.displayIndex = 0;
      displays.sort(() => Math.random() - 0.5);
    }
    Face
      .render({
        display,
        tint: 'rgba(16, 16, 32, 0.5)',
      })
      .then(() => {
        this.renderFaceTimeout = setTimeout(this.renderFace);
      });
  }

  dispose() {
    super.dispose();
    clearTimeout(this.renderFaceTimeout);
  }
}

export default Level1;
