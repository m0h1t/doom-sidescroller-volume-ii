import { Container, Graphics } from 'pixi.js'
import { Physics } from '../engine/physics/Physics.ts'
import type { RapierBody, RapierCollider } from '../engine/physics/Physics.ts'
import type { InputManager } from '../engine/input/InputManager.ts'
import {
  PLAYER_W, PLAYER_H, PLAYER_SPEED, JUMP_VEL,
  COYOTE_S, JUMP_BUFFER_S, WORLD_DEATH_Y,
  FALL_GRAVITY, SHORTHOP_GRAVITY,
} from './constants.ts'

const HW = PLAYER_W / 2
const HH = PLAYER_H / 2

export class Player {
  readonly container: Container
  private gfx: Graphics
  private body: RapierBody
  private collider: RapierCollider
  private physics: Physics

  private grounded = false
  private coyoteTimer = 0
  private jumpBuffer = 0
  private wasJumpHeld = false
  private facingRight = true

  score = 0
  health = 100

  constructor(physics: Physics, startX: number, startY: number) {
    this.physics = physics
    const { body, collider } = physics.createDynamic(startX, startY, HW, HH)
    this.body = body
    this.collider = collider

    this.container = new Container()
    this.gfx = new Graphics()
    this.container.addChild(this.gfx)
    this.buildSprite()
    this.syncSprite()
  }

  private buildSprite(): void {
    const g = this.gfx
    g.clear()

    // ── Body (symmetric) ───────────────────────────────────────────────────
    g.rect(-HW, -HH, PLAYER_W, PLAYER_H).fill(0xcc3322)
    // Shoulder pads
    g.rect(-HW - 3, -HH + 4, 5, 12).fill(0x992211)
    g.rect(HW - 2,  -HH + 4, 5, 12).fill(0x992211)
    // Visor
    g.rect(-HW + 4, -HH + 8, PLAYER_W - 8, 9).fill(0x1188ee)
    g.rect(-HW + 5, -HH + 9, PLAYER_W - 10, 4).fill(0x44ccff)
    // Belt
    g.rect(-HW, 4, PLAYER_W, 4).fill(0x771100)
    // Boots
    g.rect(-HW + 2, HH - 12, 10, 12).fill(0x991111)
    g.rect(HW - 12, HH - 12, 10, 12).fill(0x991111)

    // ── Gun (explicit per-direction — no scale flip) ────────────────────────
    if (this.facingRight) {
      // Barrel extends right
      g.rect(HW - 2,  -HH + 16, 14, 6).fill(0x888888)
      g.rect(HW - 2,  -HH + 17, 14, 2).fill(0xaaaaaa)
      g.rect(HW,      -HH + 22,  6, 5).fill(0x555555)
    } else {
      // Barrel extends left
      g.rect(-HW - 12, -HH + 16, 14, 6).fill(0x888888)
      g.rect(-HW - 12, -HH + 17, 14, 2).fill(0xaaaaaa)
      g.rect(-HW - 6,  -HH + 22,  6, 5).fill(0x555555)
    }
  }

  update(dt: number, input: InputManager): void {
    const nowGrounded = this.physics.isGrounded(this.body, this.collider, HH)

    // Coyote time
    if (this.grounded && !nowGrounded) {
      this.coyoteTimer = COYOTE_S
    } else if (nowGrounded) {
      this.coyoteTimer = 0
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt)
    }
    this.grounded = nowGrounded

    // Jump buffer via rising-edge detection
    const jumpJustPressed = input.jump && !this.wasJumpHeld
    this.wasJumpHeld = input.jump
    if (jumpJustPressed) this.jumpBuffer = JUMP_BUFFER_S
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt)

    const vel = this.body.linvel()

    // ── Horizontal ──────────────────────────────────────────────────────────
    let vx: number
    if (input.left) {
      vx = -PLAYER_SPEED
      if (this.facingRight) { this.facingRight = false; this.buildSprite() }
    } else if (input.right) {
      vx = PLAYER_SPEED
      if (!this.facingRight) { this.facingRight = true; this.buildSprite() }
    } else {
      vx = vel.x * (this.grounded ? Math.pow(0.001, dt) : Math.pow(0.35, dt))
    }

    // ── Vertical / jump ─────────────────────────────────────────────────────
    let vy = vel.y
    const canJump = this.grounded || this.coyoteTimer > 0

    if (this.jumpBuffer > 0 && canJump) {
      vy = JUMP_VEL
      this.jumpBuffer = 0
      this.coyoteTimer = 0
    } else if (vy > 0) {
      // Falling — extra pull for snappy descent
      vy += FALL_GRAVITY * dt
    } else if (vy < 0 && !input.jump) {
      // Rising with jump released — cut arc short
      vy += SHORTHOP_GRAVITY * dt
    }

    this.body.setLinvel({ x: vx, y: vy }, true)

    // Respawn on death floor
    if (this.body.translation().y > WORLD_DEATH_Y) {
      this.body.setTranslation({ x: 200, y: 300 }, true)
      this.body.setLinvel({ x: 0, y: 0 }, true)
      this.health = Math.max(0, this.health - 20)
    }

    this.score = Math.max(this.score, Math.floor(this.body.translation().x / 10))
  }

  syncSprite(): void {
    const pos = this.body.translation()
    this.container.x = Math.round(pos.x)
    this.container.y = Math.round(pos.y)
  }

  get x() { return this.body.translation().x }
  get y() { return this.body.translation().y }

  destroy(): void {
    this.physics.removeBody(this.body)
    this.container.destroy()
  }
}
