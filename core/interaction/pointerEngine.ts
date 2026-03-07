import type { Point } from '@/types'

export interface PointerEngineParams {
  toolMode: string
  isPanning: boolean
  isDrawing: boolean
  isDragSelecting: boolean
  isDraggingElement: boolean
}

export const pointerEngine = {}
// ============================================
// POINTER MOVE
// ============================================

const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {

  e.preventDefault();
  e.stopPropagation();

  const canvasPoint = getCanvasPoint(e);
  if (!canvasPoint) return;

  const worldPoint = canvasToWorld(canvasPoint);

  setWorldMousePos(worldPoint);

  // ============================================
  // HOVER DETECTION (THROTTLED)
  // ============================================

  const now = performance.now();

  if (now - hoverThrottleRef.current > HOVER_THROTTLE) {

    hoverThrottleRef.current = now;

    if (
      toolMode === 'select' &&
      !isPanning &&
      !isDrawing &&
      !isDragSelecting &&
      !isDraggingElement
    ) {

      const hit = hitTest(worldPoint);

      if (hit) {

        setHoveredElement(hit.id);
        setHoveredElementType(hit.type);

        setCursor('pointer');

      } else {

        setHoveredElement(null);
        setHoveredElementType(null);

        setCursor('default');
      }
    }
  }

  // ============================================
  // PAN
  // ============================================

  if (isPanning) {

    const dx = (canvasPoint.x - panStart.x) * PAN_SENSITIVITY;
    const dy = (canvasPoint.y - panStart.y) * PAN_SENSITIVITY;

    setCanvasOffset({
      x: offset.x + dx,
      y: offset.y + dy
    });

    setPanStart(canvasPoint);

    return;
  }

  // ============================================
  // DRAG SELECTION
  // ============================================

  if (isDragSelecting && selectionStart) {

    setSelectionBox({
      start: selectionStart,
      current: worldPoint
    });

    return;
  }

  // ============================================
  // DRAG ELEMENT
  // ============================================

  if (isDraggingElement && draggedElement) {

    const newPosition = worldPoint;

    const furniture = projectElements?.furniture.find(f => f.id === draggedElement);

    if (furniture) {
      furniture.position = {
        x: newPosition.x,
        y: newPosition.y
      };
    }

    const door = projectElements?.doors.find(d => d.id === draggedElement);

    if (door) {
      door.position = newPosition.x;
    }

    const window = projectElements?.windows.find(w => w.id === draggedElement);

    if (window) {
      window.position = newPosition.x;
    }

    setCursor('move');

    return;
  }

  // ============================================
  // DRAWING WALL
  // ============================================

  if (isDrawing && drawStart) {

    let snappedPoint = getBestSnapPoint(worldPoint);

    snappedPoint = applyAngleSnap(drawStart, snappedPoint);

    updateDrawing(snappedPoint);

    setCursor('crosshair');

    return;
  }

  // ============================================
  // LONG PRESS DETECTION
  // ============================================

  const longPressResult = checkLongPress(
    gestureStateRef.current,
    worldPoint
  );

  if (longPressResult) {
    console.log('Long press detected at:', worldPoint);
  }
