import RAPIER from '@dimforge/rapier2d-compat'

export type { RigidBody, Collider } from '@dimforge/rapier2d-compat'

export class Physics {
  world!: RAPIER.World

  async init(): Promise<void> {
    await RAPIER.init()
    this.world = new RAPIER.World({ x: 0, y: 2600 }) // match DOOM 1 gravity
  }

  step(deltaMs: number): void {
    this.world.timestep = Math.min(deltaMs / 1000, 0.1)
    this.world.step()
  }

  destroy(): void {
    this.world.free()
  }
}
