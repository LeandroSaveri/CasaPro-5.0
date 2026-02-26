import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { furnitureCategories, getFurnitureByCategory } from '@/data/furnitureLibrary';
import { Search, ChevronRight, Star, RotateCw } from 'lucide-react';

const FurniturePanel: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const { 
    selectedFurnitureItem,
    setSelectedFurnitureItem,
    addFurniture,
    currentProject,
  } = useProjectStore();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleFurnitureSelect = (furnitureId: string, categoryId: string) => {
    setSelectedFurnitureItem(furnitureId);
    
    // Adicionar móvel ao projeto
    if (currentProject) {
      const furniture = getFurnitureByCategory(categoryId).find(f => f.id === furnitureId);
      
      if (furniture) {
        addFurniture({
          type: furniture.id,
          category: furniture.category,
          subcategory: furniture.subcategory,
          position: { x: 0, y: 0 },
          rotation: 0,
          scale: { 
            x: furniture.defaultWidth, 
            y: furniture.defaultDepth 
          },
          width: furniture.defaultWidth,
          height: furniture.defaultHeight,
          depth: furniture.defaultDepth,
          color: furniture.colors[0],
          material: furniture.materials[0],
          name: furniture.name,
          visible: true,
          locked: false,
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] border-l border-[#444]">
      {/* Header */}
      <div className="p-4 border-b border-[#444]">
        <h2 className="text-white font-semibold mb-3">Biblioteca de Móveis</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={16} />
          <input
            type="text"
            placeholder="Buscar móveis..."
            className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg pl-10 pr-3 py-2 text-white text-sm placeholder-[#666] focus:outline-none focus:border-[#c9a962]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {furnitureCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const furniture = getFurnitureByCategory(category.id);
          
          return (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg transition-all bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
                <ChevronRight 
                  size={18} 
                  className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>
              
              {/* Furniture Items */}
              {isExpanded && (
                <div className="mt-2 ml-4 space-y-1">
                  {furniture.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleFurnitureSelect(item.id, category.id)}
                      className={`
                        w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left
                        ${selectedFurnitureItem === item.id 
                          ? 'bg-[#c9a962] text-[#1a1a1a]' 
                          : 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]'
                        }
                      `}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-[10px] opacity-70">
                          {item.defaultWidth.toFixed(1)}m × {item.defaultDepth.toFixed(1)}m
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button 
                          className="p-1 rounded hover:bg-white/20"
                          title="Favoritar"
                        >
                          <Star size={12} />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Item Info */}
      {selectedFurnitureItem && (
        <div className="p-4 border-t border-[#444] bg-[#2a2a2a]">
          <div className="text-[#c9a962] text-sm font-medium mb-2">Item Selecionado</div>
          <div className="flex items-center gap-3">
            {(() => {
              const allFurniture = furnitureCategories.flatMap(cat => getFurnitureByCategory(cat.id));
              const item = allFurniture.find(f => f.id === selectedFurnitureItem);
              return item ? (
                <>
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="text-white text-sm">{item.name}</div>
                    <div className="text-[#888] text-xs">
                      {item.defaultWidth.toFixed(1)}m × {item.defaultHeight.toFixed(1)}m × {item.defaultDepth.toFixed(1)}m
                    </div>
                  </div>
                </>
              ) : null;
            })()}
          </div>
          
          {/* Quick Controls */}
          <div className="flex gap-2 mt-3">
            <button 
              className="flex-1 flex items-center justify-center gap-1 p-2 bg-[#1a1a1a] rounded-lg text-[#e0e0e0] text-xs hover:bg-[#3a3a3a]"
              title="Rotacionar"
            >
              <RotateCw size={12} />
              Rotacionar
            </button>
          </div>
        </div>
      )}

      {/* Favorites Section */}
      <div className="p-4 border-t border-[#444]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#888] text-sm">Favoritos</span>
          <Star size={14} className="text-[#c9a962]" />
        </div>
        <div className="text-[#666] text-xs text-center py-2">
          Clique na estrela para favoritar itens
        </div>
      </div>
    </div>
  );
};

export default FurniturePanel;
