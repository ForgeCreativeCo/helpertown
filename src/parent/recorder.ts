/**
 * Records voice lines with the tablet's microphone (MediaRecorder). The mic
 * only works on a secure page (https, or localhost).
 */
export const MAX_RECORD_MS = 8000;

export function canRecord(): boolean {
  return window.isSecureContext && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

export class Recorder {
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stopTimer: ReturnType<typeof setTimeout> | null = null;

  get recording(): boolean {
    return this.rec?.state === 'recording';
  }

  /** Starts recording. `onAutoStop` fires if the max length is reached. */
  async start(onAutoStop: () => void): Promise<void> {
    this.stream ??= await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
    this.rec = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.rec.start();
    this.stopTimer = setTimeout(onAutoStop, MAX_RECORD_MS);
  }

  stop(): Promise<Blob> {
    const rec = this.rec;
    if (this.stopTimer) clearTimeout(this.stopTimer);
    if (!rec || rec.state !== 'recording') return Promise.reject(new Error('Not recording'));
    return new Promise((resolve) => {
      rec.onstop = () => resolve(new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }));
      rec.stop();
    });
  }

  /** Turns the microphone off. */
  release(): void {
    if (this.stopTimer) clearTimeout(this.stopTimer);
    if (this.rec?.state === 'recording') this.rec.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
  }
}
