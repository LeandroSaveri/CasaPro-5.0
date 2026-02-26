import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { X, Trash2, Copy, Move, RotateCw } from 'lucide-react';

const PropertiesPanel: React.FC = () => {
  const { 
    selectedElement, 
    selectedElementType, 
    currentProject,
    selectElement,
    updateWall,
    updateRoom,
    updateFurniture,
    deleteWall,
    deleteRoom,
    deleteDoor,
    deleteWindow,
    deleteFurniture,
  } = useProjectStore();

  if (!selectedElement || !selectedElementType || !currentProject) {
    return (
      <div className="h-full flex flex-col bg-[#1a1a1a] border-l border-[#444] p-4">
        <div className="text-center py-8">
          <div className="text-[#444] mb-3">
            <Move size={48} className="mx-auto" />
          </div>
          <p className="text-[#666] text-sm">
            Selecione um elemento para editar suas propriedades
          </p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    switch (selectedElementType) {
      case 'wall':
        deleteWall(selectedElement);
        break;
      case 'room':
        deleteRoom(selectedElement);
        break;
      case 'door':
        deleteDoor(selectedElement);
        break;
      case 'window':
        deleteWindow(selectedElement);
        break;
      case 'furniture':
        deleteFurniture(selectedElement);
        break;
    }
    selectElement(null);
  };

  const renderProperties = () => {
    switch (selectedElementType) {
      case 'wall': {
        const wall = currentProject.walls.find(w => w.id === selectedElement);
        if (!wall) return null;
        
        const length = Math.sqrt(
          Math.pow(wall.end.x - wall.start.x, 2) + 
          Math.pow(wall.end.y - wall.start.y, 2)
        );
        
        return (
          <div className="space-y-4">
            <div className="text-[#c9a962] text-sm font-medium mb-3">Propriedades da Parede</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#888] text-xs block mb-1">Comprimento</label>
                <input 
                  type="text" 
                  value={`${length.toFixed(2)} m`}
                  readOnly
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs block mb-1">Altura</label>
                <input 
                  type="number" 
                  value={wall.height}
                  onChange={(e) => updateWall(wall.id, { height: parseFloat(e.target.value) })}
                  step="0.1"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Espessura</label>
              <input 
                type="number" 
                value={wall.thickness}
                onChange={(e) => updateWall(wall.id, { thickness: parseFloat(e.target.value) })}
                step="0.01"
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Cor</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={wall.color}
                  onChange={(e) => updateWall(wall.id, { color: e.target.value })}
                  className="w-10 h-8 rounded border border-[#444]"
                />
                <input 
                  type="text" 
                  value={wall.color}
                  onChange={(e) => updateWall(wall.id, { color: e.target.value })}
                  className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#888] text-xs block mb-1">Início X</label>
                <input 
                  type="number" 
                  value={wall.start.x.toFixed(2)}
                  readOnly
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs block mb-1">Início Y</label>
                <input 
                  type="number" 
                  value={wall.start.y.toFixed(2)}
                  readOnly
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#888] text-xs block mb-1">Fim X</label>
                <input 
                  type="number" 
                  value={wall.end.x.toFixed(2)}
                  readOnly
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs block mb-1">Fim Y</label>
                <input 
                  type="number" 
                  value={wall.end.y.toFixed(2)}
                  readOnly
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          </div>
        );
      }
      
      case 'room': {
        const room = currentProject.rooms.find(r => r.id === selectedElement);
        if (!room) return null;
        
        return (
          <div className="space-y-4">
            <div className="text-[#c9a962] text-sm font-medium mb-3">Propriedades do Cômodo</div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Nome</label>
              <input 
                type="text" 
                value={room.name}
                onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Área</label>
              <input 
                type="text" 
                value={`${room.area.toFixed(2)} m²`}
                readOnly
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Cor</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={room.color}
                  onChange={(e) => updateRoom(room.id, { color: e.target.value })}
                  className="w-10 h-8 rounded border border-[#444]"
                />
                <input 
                  type="text" 
                  value={room.color}
                  onChange={(e) => updateRoom(room.id, { color: e.target.value })}
                  className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Material do Piso</label>
              <select 
                value={room.floorMaterial}
                onChange={(e) => updateRoom(room.id, { floorMaterial: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
              >
                <option value="ceramic">Cerâmica</option>
                <option value="porcelain">Porcelanato</option>
                <option value="wood">Madeira</option>
                <option value="laminate">Laminado</option>
                <option value="vinyl">Vinílico</option>
                <option value="carpet">Carpete</option>
                <option value="concrete">Concreto</option>
              </select>
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Número de vértices</label>
              <input 
                type="text" 
                value={room.points.length}
                readOnly
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
              />
            </div>
          </div>
        );
      }
      
      case 'furniture': {
        const furniture = currentProject.furniture.find(f => f.id === selectedElement);
        if (!furniture) return null;
        
        return (
          <div className="space-y-4">
            <div className="text-[#c9a962] text-sm font-medium mb-3">Propriedades do Móvel</div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Nome</label>
              <input 
                type="text" 
                value={furniture.name}
                onChange={(e) => updateFurniture(furniture.id, { name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#888] text-xs block mb-1">Posição X</label>
                <input 
                  type="number" 
                  value={furniture.position.x.toFixed(2)}
                  onChange={(e) => updateFurniture(furniture.id, { 
                    position: { ...furniture.position, x: parseFloat(e.target.value) }
                  })}
                  step="0.1"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs block mb-1">Posição Y</label>
                <input 
                  type="number" 
                  value={furniture.position.y.toFixed(2)}
                  onChange={(e) => updateFurniture(furniture.id, { 
                    position: { ...furniture.position, y: parseFloat(e.target.value) }
                  })}
                  step="0.1"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Rotação (graus)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={(furniture.rotation * 180 / Math.PI).toFixed(0)}
                  onChange={(e) => updateFurniture(furniture.id, { 
                    rotation: parseFloat(e.target.value) * Math.PI / 180
                  })}
                  className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
                <button 
                  onClick={() => updateFurniture(furniture.id, { 
                    rotation: furniture.rotation + Math.PI / 2
                  })}
                  className="px-3 py-1 bg-[#2a2a2a] border border-[#444] rounded text-white hover:bg-[#3a3a3a]"
                >
                  <RotateCw size={14} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#888] text-xs block mb-1">Largura</label>
                <input 
                  type="number" 
                  value={furniture.scale.x.toFixed(2)}
                  onChange={(e) => updateFurniture(furniture.id, { 
                    scale: { ...furniture.scale, x: parseFloat(e.target.value) }
                  })}
                  step="0.1"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs block mb-1">Profundidade</label>
                <input 
                  type="number" 
                  value={furniture.scale.y.toFixed(2)}
                  onChange={(e) => updateFurniture(furniture.id, { 
                    scale: { ...furniture.scale, y: parseFloat(e.target.value) }
                  })}
                  step="0.1"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Cor</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={furniture.color}
                  onChange={(e) => updateFurniture(furniture.id, { color: e.target.value })}
                  className="w-10 h-8 rounded border border-[#444]"
                />
                <input 
                  type="text" 
                  value={furniture.color}
                  onChange={(e) => updateFurniture(furniture.id, { color: e.target.value })}
                  className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[#888] text-xs block mb-1">Material</label>
              <select 
                value={furniture.material}
                onChange={(e) => updateFurniture(furniture.id, { material: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-2 py-1 text-white text-sm"
              >
                <option value="wood">Madeira</option>
                <option value="metal">Metal</option>
                <option value="plastic">Plástico</option>
                <option value="glass">Vidro</option>
                <option value="fabric">Tecido</option>
                <option value="leather">Couro</option>
              </select>
            </div>
          </div>
        );
      }
      
      default:
        return (
          <div className="text-center py-8">
            <p className="text-[#666] text-sm">
              Propriedades não disponíveis para este tipo de elemento
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] border-l border-[#444]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#444]">
        <h2 className="text-white font-semibold">Propriedades</h2>
        <button
          onClick={() => selectElement(null)}
          className="p-1 text-[#888] hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderProperties()}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-[#444]">
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900/70 transition-colors"
          >
            <Trash2 size={16} />
            Excluir
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2a2a] text-[#e0e0e0] rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            <Copy size={16} />
            Duplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
