import { Game } from './game/Game.ts'

const container = document.getElementById('app')!
const game = new Game(container)
game.start()
