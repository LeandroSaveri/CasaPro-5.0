import React, { useRef, useEffect } from "react";

import { renderRoom } from "@/core/render/roomRenderer";
import { renderWall } from "@/core/render/wallRenderer";

import drawDoor from "@/core/render/drawDoor";
import drawWindow from "@/core/render/drawWindow";
import drawFurniture from "@/core/render/drawFurniture";
import drawPreview from "@/core/render/drawPreview";

import { useProjectStore } from "@/store/projectStore";

interface Canvas2DProps {
  projectElements: {
    rooms: any[];
    walls: any[];
    doors: any[];
    windows: any[];
    furniture: any[];
  };
}

const Canvas2D: React.FC<Canvas2DProps> = ({ projectElements }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { isDrawing, drawStart, drawCurrent } = useProjectStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { rooms, walls, doors, windows, furniture } = projectElements;

      // ROOMS
      rooms.forEach((room) => {
        renderRoom(ctx, room);
      });

      // WALLS
      walls.forEach((wall) => {
        renderWall(ctx, wall);
      });

      // DOORS
      doors.forEach((door) => {
        drawDoor(ctx, door);
      });

      // WINDOWS
      windows.forEach((window) => {
        drawWindow(ctx, window);
      });

      // FURNITURE
      furniture.forEach((item) => {
        drawFurniture(ctx, item);
      });

      // DRAW PREVIEW
      drawPreview({
        ctx,
        isDrawing,
        drawStart,
        drawCurrent,
      });
    };

    render();
  }, [projectElements, isDrawing, drawStart, drawCurrent]);

  return (
    <canvas
      ref={canvasRef}
      width={2000}
      height={2000}
      className="w-full h-full bg-white"
    />
  );
};

export default Canvas2D;
