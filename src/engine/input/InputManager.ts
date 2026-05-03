export type Keys = Record<string, boolean>

export class InputManager {
  readonly keys: Keys = {}
  private _onJump: (() => void) | null = null

  init(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      if (e.code === 'Space' || e.code === 'KeyW') this._onJump?.()
    })
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false })
  }

  onJump(cb: () => void): void { this._onJump = cb }

  get left()  { return !!this.keys['KeyA'] || !!this.keys['ArrowLeft'] }
  get right() { return !!this.keys['KeyD'] || !!this.keys['ArrowRight'] }
  get shoot() { return !!this.keys['Space'] }
  get crouch(){ return !!this.keys['KeyS'] || !!this.keys['ArrowDown'] }

  destroy(): void {
    // listeners are on window; call only if managing AbortController later
  }
}
