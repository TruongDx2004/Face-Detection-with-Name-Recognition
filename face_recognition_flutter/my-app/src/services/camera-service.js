class CameraService {
  static #instance = new CameraService();
  static getInstance() {
    return this.#instance;
  }

  #stream = null;
  #videoElement = null;
  #isInitialized = false;
  #currentZoomLevel = 1.0;

  constructor() {
    this.#isInitialized = false;
    this.#currentZoomLevel = 1.0;
  }

  get isInitialized() {
    return this.#isInitialized;
  }

  get currentZoomLevel() {
    return this.#currentZoomLevel;
  }

  // Initialize camera service
  async initialize({ videoElement, facingMode = 'environment' } = {}) {
    try {
      // Request camera permissions
      const permissionStatus = await this.#requestCameraPermission();
      if (!permissionStatus) {
        console.error('Camera permission denied');
        return false;
      }

      // Initialize video stream
      this.#videoElement = videoElement || document.createElement('video');
      this.#stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });

      this.#videoElement.srcObject = this.#stream;
      this.#videoElement.play();
      this.#isInitialized = true;
      this.#currentZoomLevel = 1.0;
      console.log('Camera initialized successfully');
      return true;
    } catch (e) {
      console.error('Failed to initialize camera:', e);
      return false;
    }
  }

  // Request camera permission
  async #requestCameraPermission() {
    try {
      // Đơn giản hóa việc xin quyền
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Dừng stream test
      return true;
    } catch (e) {
      console.error('Error requesting camera permission:', e);
      alert('Camera access is required. Please enable it in your browser settings.');
      return false;
    }
  }

  // Switch between front and back camera
  async switchCamera() {
    if (!this.#isInitialized || !this.#stream) {
      console.warn('Camera not initialized');
      return false;
    }

    try {
      const currentFacingMode = this.#stream.getVideoTracks()[0].getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      // Stop current stream
      this.#stream.getTracks().forEach(track => track.stop());

      // Start new stream
      this.#stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
      });

      this.#videoElement.srcObject = this.#stream;
      this.#videoElement.play();
      this.#currentZoomLevel = 1.0;
      console.log('Camera switched successfully to:', newFacingMode);
      return true;
    } catch (e) {
      console.error('Failed to switch camera:', e);
      return false;
    }
  }

  // Take a picture and return as data URL
  async takePicture() {
    if (!this.#isInitialized || !this.#videoElement) {
      console.error('Camera not initialized');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.#videoElement.videoWidth;
      canvas.height = this.#videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.#videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      console.log('Picture taken');
      return dataUrl;
    } catch (e) {
      console.error('Failed to take picture:', e);
      return null;
    }
  }

  // Take a picture and return as Uint8Array
  async takePictureAsBytes() {
    const dataUrl = await this.takePicture();
    if (!dataUrl) return null;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (e) {
      console.error('Failed to convert picture to bytes:', e);
      return null;
    }
  }

  // Compress and resize image
  async compressImage(dataUrl, { maxWidth = 1024, maxHeight = 1024, quality = 0.85 } = {}) {
    try {
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize if necessary
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      const response = await fetch(compressedDataUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const compressedBytes = new Uint8Array(arrayBuffer);

      console.log(`Image compressed: ${dataUrl.length} -> ${compressedBytes.length} bytes`);
      return compressedBytes;
    } catch (e) {
      console.error('Failed to compress image:', e);
      return null;
    }
  }

  // Convert image to base64 string
  imageToBase64(imageBytes) {
    const base64String = btoa(String.fromCharCode(...imageBytes));
    return `data:image/jpeg;base64,${base64String}`;
  }

  // Convert base64 string to image bytes
  base64ToImage(base64String) {
    const binaryString = atob(base64String.replace(/^data:image\/[a-z]+;base64,/, ''));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Set zoom level (limited support in browsers)
  async setZoomLevel(zoom) {
    if (!this.#isInitialized || !this.#stream) {
      console.error('Camera not initialized');
      return;
    }

    try {
      const track = this.#stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      const clampedZoom = Math.max(capabilities.zoom?.min || 1, Math.min(capabilities.zoom?.max || 1, zoom));

      await track.applyConstraints({ advanced: [{ zoom: clampedZoom }] });
      this.#currentZoomLevel = clampedZoom;
      console.log('Zoom level set to:', clampedZoom);
    } catch (e) {
      console.error('Failed to set zoom level:', e);
    }
  }

  // Get max zoom level
  async getMaxZoomLevel() {
    if (!this.#isInitialized || !this.#stream) {
      return null;
    }
    try {
      const track = this.#stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      return capabilities.zoom?.max || 1;
    } catch (e) {
      console.error('Failed to get max zoom level:', e);
      return null;
    }
  }

  // Get min zoom level
  async getMinZoomLevel() {
    if (!this.#isInitialized || !this.#stream) {
      return null;
    }
    try {
      const track = this.#stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      return capabilities.zoom?.min || 1;
    } catch (e) {
      console.error('Failed to get min zoom level:', e);
      return null;
    }
  }

  // Pause camera preview
  pausePreview() {
    if (this.#videoElement) {
      this.#videoElement.pause();
      console.log('Camera preview paused');
    }
  }

  // Resume camera preview
  resumePreview() {
    if (this.#videoElement) {
      this.#videoElement.play();
      console.log('Camera preview resumed');
    }
  }

  // Dispose camera resources
  dispose() {
    if (this.#stream) {
      this.#stream.getTracks().forEach(track => track.stop());
      this.#stream = null;
    }
    if (this.#videoElement) {
      this.#videoElement.srcObject = null;
      this.#videoElement = null;
    }
    this.#isInitialized = false;
    console.log('Camera service disposed');
  }

  // Check if camera is available
  get isCameraAvailable() {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  }

  // Check if front camera is available
  async hasFrontCamera() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput' && device.facingMode === 'user');
    } catch (e) {
      console.error('Error checking front camera:', e);
      return false;
    }
  }

  // Check if back camera is available
  async hasBackCamera() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput' && device.facingMode === 'environment');
    } catch (e) {
      console.error('Error checking back camera:', e);
      return false;
    }
  }

  // Get available cameras count
  async getAvailableCamerasCount() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput').length;
    } catch (e) {
      console.error('Error counting cameras:', e);
      return 0;
    }
  }
}

export default CameraService;