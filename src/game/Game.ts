import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Renderer } from '../engine/renderer/Renderer.ts'
import { Physics } from '../engine/physics/Physics.ts'
import { InputManager } from '../engine/input/InputManager.ts'
import { Camera } from '../engine/renderer/Camera.ts'
import { audioManager } from '../engine/audio/AudioManager.ts'
import { Player } from './Player.ts'
import { World } from './World.ts'
import { CHUNK_W } from './constants.ts'

export class Game {
  private renderer: Renderer
  private physics: Physics
  private input: InputManager
  private camera: Camera
  private player!: Player
  private world!: World
  private worldContainer!: Container
  private hud!: Container
  private scoreText!: Text
  private healthBar!: Graphics
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new Renderer()
    this.physics = new Physics()
    this.input = new InputManager()
    this.camera = new Camera()
  }

  async start(): Promise<void> {
    await this.renderer.init(this.container)
    await this.physics.init()
    this.input.init()

    this.container.addEventListener('pointerdown', () => audioManager.unlock(), { once: true })

    this.buildScene()

    this.renderer.ticker.add((ticker) => {
      const dt = ticker.deltaMS / 1000

      this.input.startFrame()
      this.player.update(dt, this.input)
      this.physics.step(ticker.deltaMS)
      this.player.syncSprite()

      const { width, height } = this.renderer.screen
      this.camera.follow(this.player.x, this.player.y, width, height, dt)
      this.camera.apply(this.worldContainer)
      this.world.scroll(this.camera.x)

      this.updateHud(width)
    })
  }

  private buildScene(): void {
    // ── World layer (scrolls with camera) ──────────────────────────────────
    this.worldContainer = new Container()
    this.renderer.stage.addChild(this.worldContainer)

    // Sky background — wide enough to cover lots of scrolling
    const sky = new Graphics()
    sky.rect(-CHUNK_W * 2, -500, CHUNK_W * 100, 2000).fill(0x080c14)
    // Distant city silhouette
    sky.addChild(this.buildCitySilhouette())
    this.worldContainer.addChild(sky)

    // Stars (static pixel dots in sky layer)
    const stars = new Graphics()
    for (let i = 0; i < 200; i++) {
      const sx = (i * 4973) % (CHUNK_W * 8) - CHUNK_W
      const sy = (i * 3571) % 400
      const bright = i % 3 === 0 ? 0xffffff : 0x8899aa
      stars.rect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1).fill(bright)
    }
    this.worldContainer.addChild(stars)

    // Platforms + physics
    this.world = new World(this.physics)
    this.worldContainer.addChild(this.world.container)

    // Player (spawns above first ground platform)
    this.player = new Player(this.physics, 160, 440)
    this.worldContainer.addChild(this.player.container)

    // ── HUD layer (fixed to screen) ────────────────────────────────────────
    this.hud = new Container()
    this.renderer.stage.addChild(this.hud)
    this.buildHud()
  }

  private buildCitySilhouette(): Graphics {
    const g = new Graphics()
    const buildings = [
      { x: 80,   w: 60, h: 180 },
      { x: 160,  w: 40, h: 220 },
      { x: 220,  w: 80, h: 150 },
      { x: 330,  w: 50, h: 260 },
      { x: 400,  w: 70, h: 190 },
      { x: 500,  w: 45, h: 240 },
      { x: 560,  w: 90, h: 170 },
      { x: 680,  w: 55, h: 210 },
      { x: 760,  w: 65, h: 200 },
      { x: 850,  w: 40, h: 280 },
    ]
    const groundY = 480
    for (const b of buildings) {
      g.rect(b.x, groundY - b.h, b.w, b.h).fill(0x0d1520)
      // Window grid
      for (let wy = groundY - b.h + 10; wy < groundY - 10; wy += 18) {
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 12) {
          const lit = ((wx * 7 + wy * 13) % 5) > 1
          if (lit) g.rect(wx, wy, 6, 8).fill(0x223344)
        }
      }
    }
    return g
  }

  private buildHud(): void {
    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fill: 0x00ff44,
      letterSpacing: 2,
    })

    // Score
    this.scoreText = new Text({ text: 'DIST  0m', style })
    this.scoreText.x = 14
    this.scoreText.y = 12
    this.hud.addChild(this.scoreText)

    // Health label
    const hpLabel = new Text({ text: 'HP', style })
    hpLabel.x = 14
    hpLabel.y = 34
    this.hud.addChild(hpLabel)

    // Health bar background
    const hpBg = new Graphics()
    hpBg.rect(36, 34, 100, 12).fill(0x221100)
    this.hud.addChild(hpBg)

    // Health bar fill (updated each frame)
    this.healthBar = new Graphics()
    this.hud.addChild(this.healthBar)

    // Controls hint (bottom-left)
    const hint = new Text({
      text: 'WASD/ARROWS · MOVE & JUMP',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: 0x334433 }),
    })
    hint.x = 14
    hint.y = this.renderer.screen.height - 22
    this.hud.addChild(hint)
  }

  private updateHud(screenWidth: number): void {
    void screenWidth
    this.scoreText.text = `DIST  ${this.player.score}m`

    const hp = Math.max(0, this.player.health)
    this.healthBar.clear()
    this.healthBar.rect(36, 34, hp, 12).fill(hp > 50 ? 0x00cc44 : hp > 25 ? 0xffaa00 : 0xff2200)
  }

  destroy(): void {
    this.renderer.destroy()
    this.physics.destroy()
  }
}
