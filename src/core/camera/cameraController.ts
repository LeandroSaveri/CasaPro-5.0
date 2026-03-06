/**
 * FILE: cameraController.ts
 *
 * O que este arquivo faz:
 * Controla movimento da câmera do canvas.
 *
 * Responsabilidade:
 * - pan suave
 * - zoom suave
 * - inércia de movimento
 * - desaceleração física
 */

export interface CameraState {
  x: number
  y: number
  scale: number
}

export interface CameraVelocity {
  vx: number
  vy: number
  vz: number
}

export class CameraController {

  private velocity: CameraVelocity = { vx: 0, vy: 0, vz: 0 }

  private damping = 0.85
  private zoomDamping = 0.8

  applyPan(state: CameraState, dx: number, dy: number): CameraState {

    this.velocity.vx += dx
    this.velocity.vy += dy

    return {
      ...state,
      x: state.x + dx,
      y: state.y + dy
    }

  }

  applyZoom(state: CameraState, factor: number): CameraState {

    this.velocity.vz += factor - 1

    return {
      ...state,
      scale: state.scale * factor
    }

  }

  update(state: CameraState): CameraState {

    this.velocity.vx *= this.damping
    this.velocity.vy *= this.damping
    this.velocity.vz *= this.zoomDamping

    return {
      x: state.x + this.velocity.vx,
      y: state.y + this.velocity.vy,
      scale: state.scale * (1 + this.velocity.vz * 0.01)
    }

  }

}
