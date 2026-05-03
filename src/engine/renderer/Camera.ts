import type { Container } from 'pixi.js'

export class Camera {
  x = 0
  y = 0

  follow(targetX: number, targetY: number, screenW: number, screenH: number, dt: number): void {
    // Player sits 35% from left, 55% from top — feels like looking ahead
    const desiredX = targetX - screenW * 0.35
    const desiredY = targetY - screenH * 0.55
    // Exponential lerp — frame-rate independent
    const k = 1 - Math.pow(0.015, dt)
    this.x += (desiredX - this.x) * k
    this.y += (desiredY - this.y) * k
    // Clamp so world never scrolls above y=0
    this.y = Math.max(0, this.y)
  }

  apply(world: Container): void {
    world.x = -Math.round(this.x)
    world.y = -Math.round(this.y)
  }
}
