import {
  detectSingleFace,
  nets,
  fetchNetWeights,
  TinyFaceDetectorOptions,
} from 'face-api.js';
import TinyFaceDetectorModel from '@/weights/tiny_face_detector_model.weights';

class Face {
  constructor() {
    this.video = document.createElement('video');
    this.video.onloadedmetadata = () => {
      this.isReady = true;
    };
    this.options = new TinyFaceDetectorOptions();
    this.loadModel();
  }

  getUserMedia() {
    const { video } = this;
    return navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch(this.getUserMedia.bind(this));
  }

  loadModel() {
    return fetchNetWeights(TinyFaceDetectorModel)
      .then(model => (
        nets.tinyFaceDetector
          .load(model)
          .then(this.getUserMedia.bind(this))
      ));
  }

  render({ display, tint }) {
    const { options, video } = this;
    return detectSingleFace(video, options)
      .then((result) => {
        if (result) {
          const { box } = result;
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
          if (tint) {
            display.context.fillStyle = tint;
            display.context.fillRect(0, 0, display.renderer.width, display.renderer.height);
          }
          display.texture.needsUpdate = true;
        }
      });
  }
}

export default new Face();
