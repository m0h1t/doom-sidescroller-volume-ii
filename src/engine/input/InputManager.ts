export class InputManager {
  private keys: Record<string, boolean> = {}
  private justPressedKeys = new Set<string>()

  init(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) this.justPressedKeys.add(e.code)
      this.keys[e.code] = true
      e.preventDefault()
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
  }

  /** Call once at the top of each game frame to flush per-frame state */
  startFrame(): void {
    this.justPressedKeys.clear()
  }

  get left()   { return !!this.keys['KeyA']  || !!this.keys['ArrowLeft'] }
  get right()  { return !!this.keys['KeyD']  || !!this.keys['ArrowRight'] }
  get crouch() { return !!this.keys['KeyS']  || !!this.keys['ArrowDown'] }
  get shoot()  { return !!this.keys['Space'] }
  get jump()   { return !!this.keys['KeyW']  || !!this.keys['ArrowUp'] }

  get jumpPressed()    { return this.justPressedKeys.has('KeyW') || this.justPressedKeys.has('ArrowUp') }
  get restartPressed() { return this.justPressedKeys.has('KeyR') }
  get mutePressed()    { return this.justPressedKeys.has('KeyM') }
}
