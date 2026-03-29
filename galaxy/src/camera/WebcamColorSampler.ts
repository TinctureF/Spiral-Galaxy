export class WebcamColorSampler {
    private video: HTMLVideoElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private isProcessing: boolean = false;
    private lastSampleTime: number = 0;
    private sampleInterval: number = 200; // ms

    public currentColor: { r: number, g: number, b: number } = { r: 0, g: 0, b: 0 };

    constructor() {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.muted = true;
        this.video.width = 128; // Higher res for better spread
        this.video.height = 128;

        this.canvas = document.createElement('canvas');
        this.canvas.width = 128;
        this.canvas.height = 128;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    public async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = stream;
            this.video.play();
        } catch (e) {
            console.error("Webcam access denied or unavailable", e);
        }
    }

    public sample(timestamp: number) {
        if (this.isProcessing || !this.ctx || !this.video.videoWidth) return;
        if (timestamp - this.lastSampleTime < this.sampleInterval) return;

        this.lastSampleTime = timestamp;
        this.isProcessing = true;

        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }

        this.currentColor = {
            r: Math.floor(r / pixelCount),
            g: Math.floor(g / pixelCount),
            b: Math.floor(b / pixelCount)
        };

        this.isProcessing = false;
    }
}
