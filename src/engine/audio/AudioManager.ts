export class AudioManager {
  private ctx: AudioContext | null = null
  muted = false

  /** Must be called from a user-gesture handler to satisfy browser autoplay policy */
  unlock(): void {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') this.ctx.resume()
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.15): void {
    if (this.muted || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const vol = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    vol.gain.setValueAtTime(gain, this.ctx.currentTime)
    vol.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(vol).connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  toggleMute(): void { this.muted = !this.muted }
}

export const audioManager = new AudioManager()
