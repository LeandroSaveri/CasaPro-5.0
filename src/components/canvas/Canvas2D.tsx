/**
 * FILE: Canvas2D.tsx
 *
 * Sistema de Renderização 2D Premium - CasaPro
 * Versão corrigida sem alterar arquitetura existente
 */

import React,{
useRef,
useEffect,
useState,
useCallback,
useMemo,
useLayoutEffect
} from "react";

import { renderWall } from "@/core/render/wallRenderer";
import { renderRoom } from "@/core/render/roomRenderer";
import { drawDoor } from "@/core/render/drawDoor";
import { drawWindow } from "@/core/render/drawWindow";
import { drawFurniture } from "@/core/render/drawFurniture";
import { drawPreview } from "@/core/render/drawPreview";
import { drawSnapIndicator } from "@/core/render/drawSnapIndicator";
import { drawSelectionBox } from "@/core/render/drawSelectionBox";

import { useProjectStore } from "@/store/projectStore";
import { useUIStore } from "@/store/uiStore";

import { WallEngine } from "@/core/geometry/wallEngine";
import type { Point, Wall, Room } from "@/types";

import {
createGestureState,
processTap,
checkLongPress,
resetGesture,
type TouchPoint
} from "@/core/interaction/gestureEngine";

import { Ruler, Grid3X3, Magnet, Maximize2, RotateCcw } from "lucide-react";

/* =====================================================
CONSTANTES
===================================================== */

const SNAP_ANGLES = [0,45,90,135,180,225,270,315] as const;
const ANGLE_SNAP_THRESHOLD = 8;
const GRID_CACHE_SIZE = 5000;
const RENDER_THROTTLE = 16;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1.0;
const HIT_TEST_THRESHOLD = 0.15;
const HOVER_THROTTLE = 50;

/* =====================================================
TIPOS
===================================================== */

interface SnapPoint{
point:Point
type:"grid"|"endpoint"|"intersection"|"angle"|"midpoint"|"center"
priority:number
distance:number
}

interface CanvasMetrics{
width:number
height:number
centerX:number
centerY:number
devicePixelRatio:number
}

interface SelectionBox{
start:Point
current:Point
}

/* =====================================================
UTILS
===================================================== */

const clamp=(value:number,min:number,max:number)=>
Math.min(Math.max(value,min),max)

/* =====================================================
COMPONENTE
===================================================== */

const Canvas2D:React.FC=()=>{

/* ======================
ENGINES
====================== */

const wallEngine=useMemo(()=>new WallEngine(),[])

/* ======================
REFS
====================== */

const canvasRef=useRef<HTMLCanvasElement>(null)
const containerRef=useRef<HTMLDivElement>(null)
const rafRef=useRef<number|null>(null)
const lastRenderRef=useRef<number>(0)
const gestureStateRef=useRef(createGestureState())

const metricsRef=useRef<CanvasMetrics>({
width:0,
height:0,
centerX:0,
centerY:0,
devicePixelRatio:1
})

/* ======================
STATES
====================== */

const [isPanning,setIsPanning]=useState(false)
const [panStart,setPanStart]=useState<Point>({x:0,y:0})
const [worldMousePos,setWorldMousePos]=useState<Point>({x:0,y:0})

const [snapIndicator,setSnapIndicator]=useState<SnapPoint|null>(null)

const [isDragSelecting,setIsDragSelecting]=useState(false)
const [selectionBox,setSelectionBox]=useState<SelectionBox|null>(null)

/* ======================
STORES
====================== */

const{
currentProject,
toolMode,
isDrawing,
drawStart,
drawCurrent,
startDrawing,
updateDrawing,
endDrawing
}=useProjectStore()

const{
canvas2D,
setCanvasScale,
setCanvasOffset
}=useUIStore()

const{scale,offset}=canvas2D

/* =====================================================
PROJECT ELEMENTS (FIX PRINCIPAL)
===================================================== */

const projectElements=useMemo(()=>{

if(!currentProject){
return{
rooms:[],
walls:[],
doors:[],
windows:[],
furniture:[],
settings:{
showGrid:true,
showAxes:true,
showMeasurements:true,
snapToGrid:true,
snapToAngle:true,
gridSize:0.5,
unit:"meters",
snapAngles:[...SNAP_ANGLES]
}
}
}

return{
rooms:currentProject.rooms??[],
walls:currentProject.walls??[],
doors:currentProject.doors??[],
windows:currentProject.windows??[],
furniture:currentProject.furniture??[],
settings:{
...currentProject.settings,
gridSize:currentProject.settings?.gridSize??0.5
}
}

},[currentProject])

/* =====================================================
COORDINATE SYSTEM
===================================================== */

const worldToCanvas=useCallback((point:Point):Point=>{
const m=metricsRef.current
return{
x:point.x*scale+offset.x+m.centerX,
y:-point.y*scale+offset.y+m.centerY
}
},[scale,offset])

const canvasToWorld=useCallback((point:Point):Point=>{
const m=metricsRef.current
return{
x:(point.x-offset.x-m.centerX)/scale,
y:-(point.y-offset.y-m.centerY)/scale
}
},[scale,offset])

/* =====================================================
GRID
===================================================== */

const drawGrid=useCallback((ctx:CanvasRenderingContext2D)=>{

if(!projectElements.settings.showGrid)return

const m=metricsRef.current
const gridSize=projectElements.settings.gridSize*scale

if(gridSize<2)return

ctx.save()
ctx.strokeStyle="rgba(255,255,255,0.04)"
ctx.lineWidth=1

for(let x=0;x<m.width;x+=gridSize){
ctx.beginPath()
ctx.moveTo(x,0)
ctx.lineTo(x,m.height)
ctx.stroke()
}

for(let y=0;y<m.height;y+=gridSize){
ctx.beginPath()
ctx.moveTo(0,y)
ctx.lineTo(m.width,y)
ctx.stroke()
}

ctx.restore()

},[projectElements,scale])

/* =====================================================
RENDER
===================================================== */

const render=useCallback(()=>{

const canvas=canvasRef.current
if(!canvas)return

const ctx=canvas.getContext("2d")
if(!ctx)return

const now=performance.now()
if(now-lastRenderRef.current<RENDER_THROTTLE)return
lastRenderRef.current=now

ctx.fillStyle="#0a0a0f"
ctx.fillRect(0,0,metricsRef.current.width,metricsRef.current.height)

/* GRID */

drawGrid(ctx)

/* ROOMS */

projectElements.rooms.forEach((room:Room)=>{

renderRoom({
ctx,
room,
isSelected:false,
isHovered:false,
worldToCanvas,
scale
})

})

/* WALLS */

projectElements.walls.forEach((wall:Wall)=>{

renderWall({
ctx,
wall,
isSelected:false,
isHovered:false,
worldToCanvas,
scale
})

})

/* DOORS */

projectElements.doors.forEach((door:any)=>{

const wall=projectElements.walls.find((w:Wall)=>w.id===door.wallId)
if(!wall)return

drawDoor({
ctx,
door,
wall,
isSelected:false,
isHovered:false,
worldToCanvas,
scale
})

})

/* WINDOWS */

projectElements.windows.forEach((window:any)=>{

const wall=projectElements.walls.find((w:Wall)=>w.id===window.wallId)
if(!wall)return

drawWindow({
ctx,
window,
wall,
isSelected:false,
isHovered:false,
worldToCanvas,
scale
})

})

/* FURNITURE */

projectElements.furniture.forEach((furniture:any)=>{

drawFurniture({
ctx,
furniture,
isSelected:false,
isHovered:false,
worldToCanvas,
scale,
canvasWidth:metricsRef.current.width,
canvasHeight:metricsRef.current.height
})

})

/* PREVIEW */

drawPreview({
ctx,
isDrawing,
drawStart,
drawCurrent,
worldToCanvas,
snapIndicator
})

drawSnapIndicator({
ctx,
snapIndicator,
worldToCanvas
})

drawSelectionBox({
ctx,
isDragSelecting,
selectionBox,
worldToCanvas
})

},[
projectElements,
drawGrid,
isDrawing,
drawStart,
drawCurrent,
snapIndicator,
selectionBox,
worldToCanvas,
scale
])

/* =====================================================
ANIMATION LOOP
===================================================== */

useEffect(()=>{

const loop=()=>{
render()
rafRef.current=requestAnimationFrame(loop)
}

rafRef.current=requestAnimationFrame(loop)

return()=>{
if(rafRef.current)cancelAnimationFrame(rafRef.current)
}

},[render])

/* =====================================================
RESIZE
===================================================== */

useLayoutEffect(()=>{

const update=()=>{

if(!containerRef.current||!canvasRef.current)return

const dpr=window.devicePixelRatio||1
const width=containerRef.current.clientWidth
const height=containerRef.current.clientHeight

canvasRef.current.width=width*dpr
canvasRef.current.height=height*dpr
canvasRef.current.style.width=`${width}px`
canvasRef.current.style.height=`${height}px`

metricsRef.current={
width:width*dpr,
height:height*dpr,
centerX:(width*dpr)/2,
centerY:(height*dpr)/2,
devicePixelRatio:dpr
}

}

update()

window.addEventListener("resize",update)

return()=>{
window.removeEventListener("resize",update)
}

},[])

/* =====================================================
RENDER JSX
===================================================== */

return(
<div
ref={containerRef}
className="w-full h-full relative overflow-hidden"
style={{touchAction:"none"}}
>

<canvas
ref={canvasRef}
className="w-full h-full"
style={{cursor:"default"}}
/>

</div>
)

}

export default Canvas2D
