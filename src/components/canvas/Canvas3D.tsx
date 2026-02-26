import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  ContactShadows,
  Grid,
  Box,
  Plane,
  Sky,
  Stars,
  SoftShadows,
} from '@react-three/drei';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import * as THREE from 'three';
import { Sun, Moon, Camera, Eye, MapPin, Video, Settings2, X } from 'lucide-react';

// PBR Material Component
const PBRMaterial: React.FC<{ 
  color: string; 
  material?: string;
  roughness?: number;
  metalness?: number;
}> = ({ color, material = 'standard', roughness = 0.5, metalness = 0 }) => {
  const materialProps = useMemo(() => {
    switch (material) {
      case 'wood':
        return { roughness: 0.7, metalness: 0 };
      case 'metal':
        return { roughness: 0.3, metalness: 0.9 };
      case 'glass':
        return { roughness: 0, metalness: 0, transparent: true, opacity: 0.3 };
      case 'concrete':
        return { roughness: 0.9, metalness: 0 };
      case 'marble':
        return { roughness: 0.1, metalness: 0 };
      case 'fabric':
        return { roughness: 0.95, metalness: 0 };
      default:
        return { roughness, metalness };
    }
  }, [material, roughness, metalness]);

  return (
    <meshStandardMaterial 
      color={color} 
      {...materialProps}
    />
  );
};

// Wall 3D Component
const Wall3D: React.FC<{ wall: any; isSelected: boolean }> = ({ wall, isSelected }) => {
  const start = new THREE.Vector3(wall.start.x, 0, wall.start.y);
  const end = new THREE.Vector3(wall.end.x, 0, wall.end.y);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const angle = Math.atan2(direction.z, direction.x);
  
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  position.y = wall.height / 2;
  
  return (
    <group position={position} rotation={[0, -angle, 0]}>
      <Box args={[length, wall.height, wall.thickness]}>
        <PBRMaterial 
          color={isSelected ? '#c9a962' : wall.color} 
          material={wall.material || 'concrete'}
        />
      </Box>
    </group>
  );
};

// Floor 3D Component
const Floor3D: React.FC<{ room: any }> = ({ room }) => {
  const shape = useMemo(() => {
    const shape = new THREE.Shape();
    if (room.points.length < 3) return shape;
    
    shape.moveTo(room.points[0].x, room.points[0].y);
    for (let i = 1; i < room.points.length; i++) {
      shape.lineTo(room.points[i].x, room.points[i].y);
    }
    shape.closePath();
    
    return shape;
  }, [room.points]);
  
  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: false,
  };
  
  return (
    <group position={[0, -0.025, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <PBRMaterial color={room.color} material={room.floorMaterial} />
      </mesh>
    </group>
  );
};

// Furniture 3D Component
const Furniture3D: React.FC<{ furniture: any; isSelected: boolean }> = ({ furniture, isSelected }) => {
  const { width, height, depth } = furniture;
  
  return (
    <group 
      position={[furniture.position.x, height / 2, furniture.position.y]}
      rotation={[0, furniture.rotation, 0]}
    >
      <Box args={[width, height, depth]}>
        <PBRMaterial 
          color={isSelected ? '#c9a962' : furniture.color} 
          material={furniture.material}
        />
      </Box>
    </group>
  );
};

// Scene Component
const Scene: React.FC = () => {
  const { currentProject, selectedElement } = useProjectStore();
  const { lighting } = useUIStore();
  
  if (!currentProject) return null;
  
  const isNight = lighting.timeOfDay < 6 || lighting.timeOfDay > 18;
  
  return (
    <>
      <SoftShadows size={lighting.shadowQuality === 'ultra' ? 50 : 25} />
      
      {/* Sky */}
      {!isNight && (
        <Sky 
          sunPosition={[lighting.sunPosition.x, lighting.sunPosition.y, lighting.sunPosition.z]}
          turbidity={8}
          rayleigh={6}
        />
      )}
      
      {/* Stars at night */}
      {isNight && <Stars radius={100} depth={50} count={5000} factor={4} />}
      
      {/* Ambient Light */}
      <ambientLight 
        intensity={isNight ? 0.1 : lighting.ambientIntensity} 
        color={lighting.ambientColor}
      />
      
      {/* Sun/Moon Light */}
      <directionalLight
        position={[lighting.sunPosition.x, lighting.sunPosition.y, lighting.sunPosition.z]}
        intensity={isNight ? 0.2 : lighting.sunIntensity}
        color={isNight ? '#8888ff' : lighting.sunColor}
        castShadow={lighting.shadowsEnabled}
        shadow-mapSize={
          lighting.shadowQuality === 'ultra' ? [4096, 4096] :
          lighting.shadowQuality === 'high' ? [2048, 2048] :
          lighting.shadowQuality === 'medium' ? [1024, 1024] : [512, 512]
        }
      />
      
      {/* Ground Grid */}
      <Grid
        position={[0, -0.01, 0]}
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#444444"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
      
      {/* Ground Plane */}
      <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <meshStandardMaterial color="#1a1a1f" />
      </Plane>
      
      {/* Render Walls */}
      {currentProject.walls.map((wall) => (
        <Wall3D 
          key={wall.id} 
          wall={wall} 
          isSelected={selectedElement === wall.id}
        />
      ))}
      
      {/* Render Rooms/Floors */}
      {currentProject.rooms.map((room) => (
        <Floor3D key={room.id} room={room} />
      ))}
      
      {/* Render Furniture */}
      {currentProject.furniture.map((f) => (
        <Furniture3D 
          key={f.id} 
          furniture={f} 
          isSelected={selectedElement === f.id}
        />
      ))}
      
      {/* Contact Shadows */}
      <ContactShadows 
        position={[0, 0.01, 0]} 
        opacity={0.4} 
        scale={50} 
        blur={2} 
        far={10} 
      />
    </>
  );
};

// Camera Controller
const CameraController: React.FC<{ mode: string }> = ({ mode }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    switch (mode) {
      case 'top':
        camera.position.set(0, 20, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'walk':
        camera.position.set(5, 1.7, 5);
        camera.lookAt(0, 1.7, 0);
        break;
      default: // orbit
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
    }
  }, [mode, camera]);
  
  return null;
};

// Main Canvas3D Component
const Canvas3D: React.FC = () => {
  const { lighting, updateLighting, cameraMode3D, setCameraMode3D } = useUIStore();
  const [showControls, setShowControls] = useState(true);
  const controlsRef = React.useRef<HTMLDivElement>(null);
  
  const isNight = lighting.timeOfDay < 6 || lighting.timeOfDay > 18;
  
  // Toggle controls panel
  const toggleControls = () => setShowControls(prev => !prev);
  
  // Close controls panel
  const closeControls = () => setShowControls(false);
  
  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking the toggle button or inside the panel
      if (target.closest('[data-camera-toggle]') || target.closest('[data-camera-panel]')) {
        return;
      }
      // Close if clicking outside the panel
      if (showControls && controlsRef.current && !controlsRef.current.contains(target)) {
        setShowControls(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showControls]);
  
  const cameraModes = [
    { id: 'orbit', label: 'Órbita', icon: <Camera size={16} /> },
    { id: 'walk', label: 'Passeio', icon: <Eye size={16} /> },
    { id: 'top', label: 'Aérea', icon: <MapPin size={16} /> },
  ];
  
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: 'high-performance',
          toneMappingExposure: lighting.exposure,
        }}
        style={{ background: isNight ? '#0a0a15' : '#87CEEB' }}
      >
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        <CameraController mode={cameraMode3D} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      
      {/* Toggle Controls Button */}
      <button
        data-camera-toggle
        onClick={toggleControls}
        className={`absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          showControls 
            ? 'bg-[#c9a962] text-[#0a0a0f]' 
            : 'bg-[#1a1a1f]/90 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:bg-[#2a2a2f]'
        }`}
        title={showControls ? 'Ocultar Configurações' : 'Mostrar Configurações'}
      >
        <Settings2 size={18} />
        <span className="text-sm font-medium">Configurações</span>
      </button>
      
      {/* Controls Overlay */}
      {showControls && (
        <div 
          ref={controlsRef}
          data-camera-panel
          className="absolute top-16 right-4 p-4 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-xl space-y-4 min-w-[280px] shadow-2xl"
        >
          {/* Close Button */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Configurações da Câmera</span>
            <button
              onClick={closeControls}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="w-full h-px bg-white/10" />
          {/* Camera Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Câmera</label>
            <div className="flex gap-2">
              {cameraModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setCameraMode3D(mode.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    cameraMode3D === mode.id
                      ? 'bg-[#c9a962] text-[#0a0a0f]'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Time of Day */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-2">
              {isNight ? <Moon size={14} /> : <Sun size={14} />}
              Horário: {Math.floor(lighting.timeOfDay)}:00
            </label>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={lighting.timeOfDay}
              onChange={(e) => updateLighting({ timeOfDay: parseFloat(e.target.value) })}
              className="w-full accent-[#c9a962]"
            />
          </div>
          
          {/* Exposure */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Exposição</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={lighting.exposure}
              onChange={(e) => updateLighting({ exposure: parseFloat(e.target.value) })}
              className="w-full accent-[#c9a962]"
            />
          </div>
          
          {/* Shadow Quality */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Qualidade das Sombras</label>
            <select
              value={lighting.shadowQuality}
              onChange={(e) => updateLighting({ shadowQuality: e.target.value as any })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Render Button */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={() => alert('Renderização em alta qualidade - Em breve!')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#c9a962] text-[#0a0a0f] rounded-xl font-semibold hover:bg-[#d4b76d] transition-all"
        >
          <Video size={18} />
          Renderizar
        </button>
      </div>
      
      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 p-3 bg-[#1a1a1f]/90 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="text-xs text-white/50 space-y-1">
          <div>Qualidade: {lighting.shadowQuality.toUpperCase()}</div>
          <div>Sombras: {lighting.shadowsEnabled ? 'Ativadas' : 'Desativadas'}</div>
          <div>Exposição: {lighting.exposure.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};

export default Canvas3D;
