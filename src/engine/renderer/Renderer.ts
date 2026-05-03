import { Application, type ApplicationOptions } from 'pixi.js'

export class Renderer {
  readonly app: Application

  constructor() {
    this.app = new Application()
  }

  async init(container: HTMLElement): Promise<void> {
    const options: Partial<ApplicationOptions> = {
      resizeTo: container,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgpu', // falls back to webgl2 automatically on iOS
    }
    await this.app.init(options)
    container.appendChild(this.app.canvas)
  }

  get stage() { return this.app.stage }
  get screen() { return this.app.screen }
  get ticker() { return this.app.ticker }

  destroy(): void {
    this.app.destroy(true)
  }
}
