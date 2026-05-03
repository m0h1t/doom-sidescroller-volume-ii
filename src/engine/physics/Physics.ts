import RAPIER from '@dimforge/rapier2d-compat'
import { GRAVITY_Y } from '../../game/constants.ts'

export type RapierBody = RAPIER.RigidBody
export type RapierCollider = RAPIER.Collider

export type PhysicsBody = {
  body: RapierBody
  collider: RapierCollider
}

export class Physics {
  private R!: typeof RAPIER
  world!: RAPIER.World

  async init(): Promise<void> {
    await RAPIER.init()
    this.R = RAPIER
    this.world = new RAPIER.World({ x: 0, y: GRAVITY_Y })
  }

  createFixed(cx: number, cy: number, hw: number, hh: number): PhysicsBody {
    const body = this.world.createRigidBody(
      this.R.RigidBodyDesc.fixed().setTranslation(cx, cy)
    )
    const collider = this.world.createCollider(
      this.R.ColliderDesc.cuboid(hw, hh).setFriction(0.3), body
    )
    return { body, collider }
  }

  createDynamic(cx: number, cy: number, hw: number, hh: number): PhysicsBody {
    const body = this.world.createRigidBody(
      this.R.RigidBodyDesc.dynamic()
        .setTranslation(cx, cy)
        .lockRotations()
        .setCcdEnabled(true)
    )
    const collider = this.world.createCollider(
      this.R.ColliderDesc.cuboid(hw, hh)
        .setFriction(0.3)
        .setRestitution(0.0),
      body
    )
    return { body, collider }
  }

  isGrounded(body: RapierBody, collider: RapierCollider, halfH: number): boolean {
    const pos = body.translation()
    const ray = new this.R.Ray({ x: pos.x, y: pos.y + halfH - 2 }, { x: 0, y: 1 })
    const hit = this.world.castRay(ray, 8, true, undefined, undefined, collider)
    return hit !== null
  }

  removeBody(body: RapierBody): void {
    this.world.removeRigidBody(body)
  }

  step(deltaMs: number): void {
    this.world.timestep = Math.min(deltaMs / 1000, 0.1)
    this.world.step()
  }

  destroy(): void {
    this.world.free()
  }
}
