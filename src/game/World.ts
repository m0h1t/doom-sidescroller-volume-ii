import { Container, Graphics } from 'pixi.js'
import { Physics } from '../engine/physics/Physics.ts'
import { PLATFORM_H, CHUNK_W, GROUND_Y } from './constants.ts'

type PlatformEntry = { gfx: Graphics; chunkIdx: number }

export class World {
  readonly container: Container
  private physics: Physics
  private platforms: PlatformEntry[] = []
  private nextChunkX = 0
  private chunkIdx = 0

  constructor(physics: Physics) {
    this.physics = physics
    this.container = new Container()
    // Seed 5 chunks so the player always has ground beneath them at start
    for (let i = 0; i < 5; i++) this.spawnChunk()
  }

  /** Call each frame with current camera.x to stream new chunks */
  scroll(cameraX: number): void {
    while (this.nextChunkX < cameraX + CHUNK_W * 5) this.spawnChunk()
  }

  private spawnChunk(): void {
    const x = this.nextChunkX
    const idx = this.chunkIdx++

    // Full-width ground platform
    this.addPlatform(x, GROUND_Y, CHUNK_W, idx)

    // 2–4 floating platforms per chunk, distributed evenly with jitter
    const count = 2 + Math.floor(this.lcg(idx * 7 + 1) * 3)
    const slotW = (CHUNK_W - 160) / count
    for (let i = 0; i < count; i++) {
      const pw = 70 + this.lcg(idx * 13 + i * 3) * 110
      const px = x + 80 + i * slotW + this.lcg(idx * 5 + i) * (slotW - pw)
      const py = GROUND_Y - 110 - this.lcg(idx * 11 + i * 7) * 200
      this.addPlatform(px, py, pw, idx)
    }

    this.nextChunkX += CHUNK_W
  }

  private addPlatform(x: number, y: number, w: number, idx: number): void {
    const hw = w / 2
    const hh = PLATFORM_H / 2
    this.physics.createFixed(x + hw, y + hh, hw, hh)

    const gfx = new Graphics()
    this.drawPlatform(gfx, w)
    gfx.x = Math.round(x)
    gfx.y = Math.round(y)
    this.container.addChild(gfx)
    this.platforms.push({ gfx, chunkIdx: idx })
  }

  private drawPlatform(g: Graphics, w: number): void {
    const W = Math.round(w)
    // Stone body
    g.rect(0, 3, W, PLATFORM_H - 3).fill(0x2a3a2a)
    // Grass top strip
    g.rect(0, 0, W, 4).fill(0x4a8a3a)
    // Lighter grass highlight
    g.rect(1, 0, W - 2, 2).fill(0x66bb55)
    // Dark pixel dashes for stone texture
    for (let px = 6; px < W - 6; px += 14) {
      g.rect(px, 6, 6, 2).fill(0x1a2a1a)
      g.rect(px + 8, 10, 5, 2).fill(0x1a2a1a)
    }
    // Left/right edge shading
    g.rect(0, 3, 2, PLATFORM_H - 3).fill(0x3a5a3a)
    g.rect(W - 2, 3, 2, PLATFORM_H - 3).fill(0x1a2a1a)
  }

  /** Deterministic pseudo-random [0,1) — avoids Math.random() seeding issues */
  private lcg(seed: number): number {
    const s = (seed * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}
