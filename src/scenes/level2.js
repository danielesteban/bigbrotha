import { Object3D } from 'three';
import {
  Scene,
  Floor,
  Voxels,
  UI,
} from 'vrengine';
import Face from '@/services/face';
// import DarkAmbient from '@/sounds/dark.ogg';

class Level1 extends Scene {
  constructor(args) {
    super(args);
    const { engine } = args;

    // engine.setAmbientSounds([DarkAmbient]);
    engine.setBackgroundColor(0x101020);

    engine.camera.fov = 75;
    engine.camera.updateProjectionMatrix();
    // engine.camera.debug.active = true;

    // Spawn a platform
    {
      const size = 8;
      const platform = new Voxels({
        generator: ({ x, y, z }) => {
          if (
            y === 0
            || (
              y === 1
              && (
                x === 0 || x === size - 1
                || z === 0 || z === size - 1
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
      const floor = new Floor({
        width: size - 2,
        height: size - 2,
      });
      floor.material.visible = false;
      floor.position.y += 0.001;
      this.add(floor);
      this.intersects.push(floor);
    }

    // Spawn a bunch of screens
    this.displays = [];
    const pivots = [];
    const count = 128;
    const stride = 1;
    for (let i = 0; i < count; i += 1) {
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
      const s = 2 + Math.random() * 0.5;
      display.scale.set(s, s, s);
      this.displays.push(display);
      pivot.add(display);
      const angle = i / count * Math.PI * 16;
      pivot.position.set(
        8 * Math.cos(angle),
        8 * Math.sin(angle) + 6,
        i * -stride
      );
      pivot.lookAt(0, 1.6, pivot.position.z + 2);
      this.add(pivot);
      pivots.push(pivot);
    }
    this.animations.push(({ delta }) => {
      pivots.forEach((pivot) => {
        pivot.position.z += delta * 4;
        if (pivot.position.z >= count * 0.25 * stride) {
          pivot.position.z -= count * stride;
        }
      });
    });

    this.displayIndex = 0;
    this.displays.reverse();
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
