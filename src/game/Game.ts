import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Renderer } from '../engine/renderer/Renderer.ts'
import { Physics } from '../engine/physics/Physics.ts'
import { InputManager } from '../engine/input/InputManager.ts'
import { Camera } from '../engine/renderer/Camera.ts'
import { audioManager } from '../engine/audio/AudioManager.ts'
import { Player } from './Player.ts'
import { World } from './World.ts'
import { CHUNK_W } from './constants.ts'

const HUD_H   = 56
const SEG_COUNT = 5     // 5 segments × 20 HP each
const SEG_W   = 22
const SEG_H   = 16
const SEG_GAP = 4

export class Game {
  private renderer:  Renderer
  private physics:   Physics
  private input:     InputManager
  private camera:    Camera
  private player!:   Player
  private world!:    World
  private worldContainer!: Container

  // HUD elements stored as fields (no fragile child-index lookups)
  private hud!:          Container
  private hudBg!:        Graphics
  private healthSegs!:   Graphics
  private hpText!:       Text
  private hpStyle!:      TextStyle
  private hpLabel!:      Text
  private titleText!:    Text
  private distLabel!:    Text
  private scoreText!:    Text

  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer  = new Renderer()
    this.physics   = new Physics()
    this.input     = new InputManager()
    this.camera    = new Camera()
  }

  async start(): Promise<void> {
    await this.renderer.init(this.container)
    await this.physics.init()
    this.input.init()

    this.container.addEventListener('pointerdown', () => audioManager.unlock(), { once: true })

    this.buildScene()
    this.buildHud()

    this.renderer.ticker.add((ticker) => {
      const dt = ticker.deltaMS / 1000
      const { width, height } = this.renderer.screen

      this.input.startFrame()
      this.player.update(dt, this.input)
      this.physics.step(ticker.deltaMS)
      this.player.syncSprite()

      this.camera.follow(this.player.x, this.player.y, width, height, dt)
      this.camera.apply(this.worldContainer)
      this.world.scroll(this.camera.x)

      this.updateHud(width, height)
    })
  }

  // ── Scene ─────────────────────────────────────────────────────────────────

  private buildScene(): void {
    this.worldContainer = new Container()
    this.renderer.stage.addChild(this.worldContainer)

    const sky = new Graphics()
    sky.rect(-CHUNK_W * 2, -500, CHUNK_W * 100, 2000).fill(0x080c14)
    sky.addChild(this.buildCitySilhouette())
    this.worldContainer.addChild(sky)

    const stars = new Graphics()
    for (let i = 0; i < 220; i++) {
      const sx = (i * 4973) % (CHUNK_W * 8) - CHUNK_W
      const sy = (i * 3571) % 420
      const bright = i % 3 === 0 ? 0xffffff : 0x7788aa
      stars.rect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1).fill(bright)
    }
    this.worldContainer.addChild(stars)

    this.world = new World(this.physics)
    this.worldContainer.addChild(this.world.container)

    this.player = new Player(this.physics, 160, 440)
    this.worldContainer.addChild(this.player.container)
  }

  private buildCitySilhouette(): Graphics {
    const g = new Graphics()
    const buildings = [
      { x: 60,  w: 55, h: 170 }, { x: 140, w: 35, h: 210 },
      { x: 200, w: 75, h: 145 }, { x: 310, w: 45, h: 260 },
      { x: 380, w: 65, h: 185 }, { x: 470, w: 40, h: 235 },
      { x: 530, w: 85, h: 165 }, { x: 650, w: 50, h: 200 },
      { x: 730, w: 60, h: 195 }, { x: 820, w: 38, h: 270 },
    ]
    const baseY = 490
    for (const b of buildings) {
      g.rect(b.x, baseY - b.h, b.w, b.h).fill(0x0c1520)
      for (let wy = baseY - b.h + 12; wy < baseY - 12; wy += 18)
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 12)
          if (((wx * 7 + wy * 13) % 5) > 1)
            g.rect(wx, wy, 6, 8).fill(0x1a2d40)
    }
    return g
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  private buildHud(): void {
    this.hud = new Container()
    this.renderer.stage.addChild(this.hud)

    // Panel background — redrawn in repositionHud
    this.hudBg = new Graphics()
    this.hud.addChild(this.hudBg)

    const dimGreen  = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: 0x2a5a2a, letterSpacing: 3 })
    const dimBlue   = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: 0x2a4a6a, letterSpacing: 3 })
    const dimCenter = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: 0x1a4a1a, letterSpacing: 4 })

    this.hpStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 22, fill: 0x00ff55, fontWeight: 'bold' })
    const scoreStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 22, fill: 0xaaddff, fontWeight: 'bold' })

    this.hpLabel   = new Text({ text: 'HEALTH',   style: dimGreen  }); this.hud.addChild(this.hpLabel)
    this.healthSegs = new Graphics();                                    this.hud.addChild(this.healthSegs)
    this.hpText    = new Text({ text: '100',       style: this.hpStyle }); this.hud.addChild(this.hpText)
    this.titleText = new Text({ text: 'VOL. II',   style: dimCenter }); this.hud.addChild(this.titleText)
    this.distLabel = new Text({ text: 'DISTANCE',  style: dimBlue   }); this.hud.addChild(this.distLabel)
    this.scoreText = new Text({ text: '0 m',       style: scoreStyle }); this.hud.addChild(this.scoreText)

    this.titleText.anchor.set(0.5, 0)
    this.distLabel.anchor.set(1, 0)
    this.scoreText.anchor.set(1, 0)

    // Initial layout (repositioned each frame when needed)
    const { width: sw, height: sh } = this.renderer.screen
    this.repositionHud(sw, sh)
  }

  private repositionHud(sw: number, sh: number): void {
    const py = sh - HUD_H   // panel top y
    const cx = sw / 2

    // Background
    this.hudBg.clear()
    this.hudBg.rect(0, py, sw, HUD_H).fill(0x05080d)
    this.hudBg.rect(0, py, sw, 1).fill(0x00aa33)           // green accent line
    this.hudBg.rect(0, py + 1, sw, 1).fill(0x002200)       // inner shadow
    this.hudBg.rect(cx - 1, py + 10, 1, HUD_H - 20).fill(0x0a1a0a)  // centre divider
    this.hudBg.rect(sw - 164, py + 10, 1, HUD_H - 20).fill(0x0a1a0a) // right divider

    // Left: health label + segments + number
    const segX  = 16
    const segY  = py + 22
    this.hpLabel.x = segX
    this.hpLabel.y = py + 8

    this.healthSegs.x = 0
    this.healthSegs.y = 0
    // Draw segments immediately so first frame looks right
    this.drawHealthSegs(segX, segY, 100)

    const afterSegs = segX + SEG_COUNT * (SEG_W + SEG_GAP)
    this.hpText.x = afterSegs + 6
    this.hpText.y = segY - 4

    // Centre: title
    this.titleText.x = cx
    this.titleText.y = py + 18

    // Right: distance label + score
    this.distLabel.x = sw - 16
    this.distLabel.y = py + 8
    this.scoreText.x = sw - 16
    this.scoreText.y = py + 20
  }

  private drawHealthSegs(segX: number, segY: number, hp: number): void {
    const filled = Math.round((hp / 100) * SEG_COUNT)
    this.healthSegs.clear()
    for (let i = 0; i < SEG_COUNT; i++) {
      const active = i < filled
      const col = hp > 60 ? 0x00dd55 : hp > 40 ? 0xffbb00 : 0xff3311
      this.healthSegs.rect(segX + i * (SEG_W + SEG_GAP), segY, SEG_W, SEG_H)
        .fill(active ? col : 0x0d1a0d)
      if (active) {
        // Top shine
        this.healthSegs.rect(segX + i * (SEG_W + SEG_GAP) + 1, segY + 1, SEG_W - 2, 3)
          .fill(hp > 60 ? 0x66ffaa : hp > 40 ? 0xffdd66 : 0xff8866)
      }
    }
  }

  private lastSH = 0
  private lastSW = 0

  private updateHud(sw: number, sh: number): void {
    // Reposition if canvas resized
    if (sw !== this.lastSW || sh !== this.lastSH) {
      this.repositionHud(sw, sh)
      this.lastSW = sw
      this.lastSH = sh
    }

    const hp   = Math.max(0, Math.min(100, this.player.health))
    const segX = 16
    const segY = sh - HUD_H + 22

    this.drawHealthSegs(segX, segY, hp)
    this.hpStyle.fill = hp > 60 ? 0x00ff55 : hp > 40 ? 0xffcc00 : 0xff4422
    this.hpText.text  = String(hp)
    this.scoreText.text = `${this.player.score} m`
  }

  destroy(): void {
    this.renderer.destroy()
    this.physics.destroy()
  }
}
