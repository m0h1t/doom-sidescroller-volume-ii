import { Renderer } from '../engine/renderer/Renderer.ts'
import { Physics } from '../engine/physics/Physics.ts'
import { InputManager } from '../engine/input/InputManager.ts'
import { audioManager } from '../engine/audio/AudioManager.ts'

export class Game {
  private renderer: Renderer
  private physics: Physics
  private input: InputManager
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new Renderer()
    this.physics = new Physics()
    this.input = new InputManager()
  }

  async start(): Promise<void> {
    await this.renderer.init(this.container)
    await this.physics.init()
    this.input.init()

    // unlock audio on first interaction
    this.container.addEventListener('pointerdown', () => audioManager.unlock(), { once: true })

    this.renderer.ticker.add((ticker) => {
      this.physics.step(ticker.deltaMS)
      // TODO: update entities, render scene
    })
  }

  destroy(): void {
    this.renderer.destroy()
    this.physics.destroy()
  }
}
