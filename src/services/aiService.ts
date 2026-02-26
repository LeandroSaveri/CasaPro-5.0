import type { Project, Room, Wall, Furniture, Point } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Interface para requisições de IA
export interface AIGenerationRequest {
  prompt: string;
  terrainWidth: number;
  terrainDepth: number;
  style?: string;
  budget?: 'low' | 'medium' | 'high' | 'luxury';
  rooms?: string[];
  preferences?: {
    naturalLight?: boolean;
    openConcept?: boolean;
    accessibility?: boolean;
    sustainability?: boolean;
  };
}

// Interface para resposta de IA
export interface AIGenerationResponse {
  project: Partial<Project>;
  recommendations: string[];
  estimatedCost: number;
  confidence: number;
}

// Interface para sugestões de design
export interface DesignSuggestion {
  type: 'layout' | 'furniture' | 'color' | 'lighting' | 'material';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'major' | 'minor';
}

// Prompts predefinidos para geração
export const predefinedPrompts = [
  {
    id: 'modern-house',
    label: 'Casa Moderna Minimalista',
    prompt: 'Crie uma casa moderna minimalista com sala integrada, cozinha americana, 3 quartos e 2 banheiros. Foco em linhas limpas e muita luz natural.',
    style: 'minimalista',
  },
  {
    id: 'cozy-apartment',
    label: 'Apartamento Aconchegante',
    prompt: 'Projete um apartamento aconchegante com sala de estar confortável, cozinha compacta, 2 quartos e 1 banheiro. Ambiente acolhedor e funcional.',
    style: 'rustico',
  },
  {
    id: 'luxury-villa',
    label: 'Vila de Luxo',
    prompt: 'Desenhe uma vila de luxo com espaços amplos, sala de jantar formal, cozinha gourmet, 4 suítes, área de lazer com piscina.',
    style: 'luxo',
  },
  {
    id: 'studio-efficient',
    label: 'Studio Eficiente',
    prompt: 'Crie um studio compacto e eficiente com área de dormir, cozinha integrada e banheiro. Máximo aproveitamento de espaço.',
    style: 'moderno',
  },
  {
    id: 'family-home',
    label: 'Casa Familiar',
    prompt: 'Projete uma casa familiar com sala espaçosa, cozinha funcional, 3 quartos (1 suíte), 2 banheiros, área de serviço e quintal.',
    style: 'moderno',
  },
  {
    id: 'industrial-loft',
    label: 'Loft Industrial',
    prompt: 'Crie um loft industrial com pé direito alto, paredes de tijolo aparente, estrutura metálica visível, espaço aberto integrado.',
    style: 'industrial',
  },
  {
    id: 'beach-house',
    label: 'Casa de Praia',
    prompt: 'Desenhe uma casa de praia com varanda ampla, sala ventilada, 3 quartos, cozinha prática, área externa com churrasqueira.',
    style: 'rustico',
  },
  {
    id: 'home-office',
    label: 'Escritório em Casa',
    prompt: 'Crie um home office profissional com mesa de trabalho, área de reunião, estante para livros, boa iluminação natural.',
    style: 'moderno',
  },
];

// Serviço de IA
class AIService {
  private apiKey: string | null = null;
  private useMockData: boolean = true;

  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || null;
    this.useMockData = !this.apiKey;
  }

  // Gerar projeto a partir de prompt
  async generateProject(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (this.useMockData) {
      return this.mockGenerateProject(request);
    }
    // Implementação real com API viria aqui
    return this.mockGenerateProject(request);
  }

  // Melhorar design existente
  async improveDesign(project: Project): Promise<DesignSuggestion[]> {
    if (this.useMockData) {
      return this.mockImproveDesign(project);
    }
    return this.mockImproveDesign(project);
  }

  // Sugerir móveis para espaço
  async suggestFurniture(roomType: string, dimensions: { width: number; depth: number }): Promise<Furniture[]> {
    if (this.useMockData) {
      return this.mockSuggestFurniture(roomType, dimensions);
    }
    return this.mockSuggestFurniture(roomType, dimensions);
  }

  // Analisar projeto e dar feedback
  async analyzeProject(project: Project): Promise<{
    score: number;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }> {
    if (this.useMockData) {
      return this.mockAnalyzeProject(project);
    }
    return this.mockAnalyzeProject(project);
  }

  // Gerar layout otimizado
  async generateOptimizedLayout(
    terrainWidth: number,
    terrainDepth: number,
    _requirements: string[]
  ): Promise<{
    rooms: Room[];
    walls: Wall[];
    flowScore: number;
  }> {
    if (this.useMockData) {
      return this.mockGenerateLayout(terrainWidth, terrainDepth);
    }
    return this.mockGenerateLayout(terrainWidth, terrainDepth);
  }

  // Mock: Gerar projeto
  private mockGenerateProject(request: AIGenerationRequest): AIGenerationResponse {
    const { prompt, terrainWidth, terrainDepth, style = 'moderno', budget = 'medium' } = request;
    
    // Detectar tipo de projeto do prompt
    const isHouse = prompt.toLowerCase().includes('casa') || prompt.toLowerCase().includes('vila');
    const isApartment = prompt.toLowerCase().includes('apartamento') || prompt.toLowerCase().includes('studio');
    const isOffice = prompt.toLowerCase().includes('escritório') || prompt.toLowerCase().includes('office');
    
    // Gerar cômodos baseados no prompt
    const rooms: Room[] = [];
    const walls: Wall[] = [];
    
    if (isHouse) {
      // Sala
      rooms.push(this.createRoom('Sala de Estar', 0, 0, 5, 4, style));
      // Cozinha
      rooms.push(this.createRoom('Cozinha', 5, 0, 3, 3, style));
      // Quartos
      rooms.push(this.createRoom('Suíte Principal', 0, 4, 4, 4, style));
      rooms.push(this.createRoom('Quarto 2', 4, 4, 3, 3, style));
      rooms.push(this.createRoom('Quarto 3', 7, 4, 3, 3, style));
      // Banheiros
      rooms.push(this.createRoom('Banheiro Suíte', 4, 4, 1, 2, style));
      rooms.push(this.createRoom('Banheiro Social', 8, 0, 2, 2, style));
    } else if (isApartment) {
      // Studio - espaço aberto
      rooms.push(this.createRoom('Espaço Principal', 0, 0, 6, 5, style));
      // Banheiro
      rooms.push(this.createRoom('Banheiro', 6, 0, 2, 2, style));
      // Cozinha compacta
      rooms.push(this.createRoom('Cozinha', 0, 5, 3, 2, style));
    } else if (isOffice) {
      // Área de trabalho
      rooms.push(this.createRoom('Área de Trabalho', 0, 0, 5, 4, style));
      // Sala de reunião
      rooms.push(this.createRoom('Sala de Reunião', 5, 0, 3, 3, style));
      // Recepção
      rooms.push(this.createRoom('Recepção', 0, 4, 4, 3, style));
    }

    // Gerar paredes a partir dos cômodos
    rooms.forEach(room => {
      walls.push(...this.generateWallsForRoom(room));
    });

    // Calcular custo estimado baseado no orçamento
    const baseCost = terrainWidth * terrainDepth * 1500;
    const budgetMultiplier = {
      low: 0.7,
      medium: 1.0,
      high: 1.5,
      luxury: 2.5,
    }[budget];

    const recommendations = this.generateRecommendations(style, rooms.length);

    return {
      project: {
        name: `Projeto ${style.charAt(0).toUpperCase() + style.slice(1)}`,
        description: prompt,
        rooms,
        walls,
        furniture: [],
      },
      recommendations,
      estimatedCost: Math.round(baseCost * budgetMultiplier),
      confidence: 0.85,
    };
  }

  // Mock: Melhorar design
  private mockImproveDesign(project: Project): DesignSuggestion[] {
    const suggestions: DesignSuggestion[] = [];

    // Analisar fluxo entre cômodos
    if (project.rooms.length > 2) {
      suggestions.push({
        type: 'layout',
        title: 'Melhorar Fluxo de Circulação',
        description: 'Considere reposicionar portas para criar um fluxo mais natural entre os cômodos principais.',
        priority: 'high',
        impact: 'major',
      });
    }

    // Verificar iluminação natural
    suggestions.push({
      type: 'lighting',
      title: 'Aumentar Entrada de Luz Natural',
      description: 'Adicione mais janelas ou aumente o tamanho das existentes para melhor iluminação.',
      priority: 'medium',
      impact: 'major',
    });

    // Sugestões de cor
    suggestions.push({
      type: 'color',
      title: 'Paleta de Cores Harmoniosa',
      description: 'Use tons neutros nas paredes principais e adicione cores em acessórios.',
      priority: 'low',
      impact: 'minor',
    });

    // Mobiliário
    if (project.furniture.length < project.rooms.length * 2) {
      suggestions.push({
        type: 'furniture',
        title: 'Completar Mobiliário',
        description: 'Adicione mais peças de mobiliário para tornar os espaços mais funcionais.',
        priority: 'medium',
        impact: 'major',
      });
    }

    // Materiais
    suggestions.push({
      type: 'material',
      title: 'Materiais Sustentáveis',
      description: 'Considere usar materiais ecológicos como bambu e madeira certificada.',
      priority: 'low',
      impact: 'minor',
    });

    return suggestions;
  }

  // Mock: Sugerir móveis
  private mockSuggestFurniture(roomType: string, dimensions: { width: number; depth: number }): Furniture[] {
    const furniture: Furniture[] = [];
    const roomArea = dimensions.width * dimensions.depth;

    const suggestions: Record<string, Array<{ type: string; category: string; width: number; depth: number; name: string }>> = {
      living: [
        { type: 'sofa', category: 'living', width: 2.2, depth: 0.9, name: 'Sofá 3 Lugares' },
        { type: 'coffee-table', category: 'living', width: 1.0, depth: 0.6, name: 'Mesa de Centro' },
        { type: 'tv-stand', category: 'living', width: 1.8, depth: 0.45, name: 'Rack para TV' },
        { type: 'armchair', category: 'living', width: 0.8, depth: 0.8, name: 'Poltrona' },
      ],
      bedroom: [
        { type: 'bed', category: 'bedroom', width: 1.6, depth: 2.0, name: 'Cama Queen' },
        { type: 'nightstand', category: 'bedroom', width: 0.5, depth: 0.4, name: 'Criado-Mudo' },
        { type: 'wardrobe', category: 'bedroom', width: 1.8, depth: 0.6, name: 'Guarda-Roupa' },
      ],
      kitchen: [
        { type: 'counter', category: 'kitchen', width: 2.4, depth: 0.6, name: 'Balcão' },
        { type: 'stove', category: 'kitchen', width: 0.6, depth: 0.6, name: 'Fogão' },
        { type: 'refrigerator', category: 'kitchen', width: 0.7, depth: 0.7, name: 'Geladeira' },
        { type: 'sink', category: 'kitchen', width: 0.8, depth: 0.6, name: 'Pia' },
      ],
      bathroom: [
        { type: 'toilet', category: 'bathroom', width: 0.4, depth: 0.6, name: 'Vaso Sanitário' },
        { type: 'sink', category: 'bathroom', width: 0.6, depth: 0.5, name: 'Lavatório' },
        { type: 'shower', category: 'bathroom', width: 0.9, depth: 0.9, name: 'Box de Banheiro' },
      ],
      office: [
        { type: 'desk', category: 'office', width: 1.4, depth: 0.7, name: 'Mesa de Escritório' },
        { type: 'office-chair', category: 'office', width: 0.65, depth: 0.65, name: 'Cadeira de Escritório' },
        { type: 'bookshelf', category: 'office', width: 0.8, depth: 0.35, name: 'Estante' },
      ],
    };

    const roomSuggestions = suggestions[roomType] || suggestions.living;

    roomSuggestions.forEach((item, index) => {
      if (roomArea > item.width * item.depth) {
        furniture.push({
          id: uuidv4(),
          type: item.type,
          category: item.category,
          subcategory: item.type,
          position: { x: index * 1.5, y: index * 0.5 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          width: item.width,
          height: 0.8,
          depth: item.depth,
          color: '#8B4513',
          material: 'wood',
          visible: true,
          locked: false,
          name: item.name,
        });
      }
    });

    return furniture;
  }

  // Mock: Analisar projeto
  private mockAnalyzeProject(project: Project): {
    score: number;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  } {
    const roomCount = project.rooms.length;
    const furnitureCount = project.furniture.length;
    const wallCount = project.walls.length;

    // Calcular pontuação base
    let score = 70;
    
    // Bônus por número de cômodos
    if (roomCount >= 3) score += 10;
    if (roomCount >= 5) score += 10;

    // Bônus por mobiliário
    if (furnitureCount >= roomCount * 2) score += 10;

    // Pontos fortes
    const strengths: string[] = [];
    if (roomCount >= 3) strengths.push('Boa distribuição de cômodos');
    if (furnitureCount > 0) strengths.push('Mobiliário bem posicionado');
    if (wallCount > 0) strengths.push('Estrutura bem definida');

    // Áreas de melhoria
    const improvements: string[] = [];
    if (furnitureCount < roomCount * 2) improvements.push('Adicionar mais mobiliário');
    if (project.doors.length === 0 && project.windows.length === 0) {
      improvements.push('Considerar mais aberturas para luz natural');
    }

    // Recomendações
    const recommendations = [
      'Mantenha espaços de circulação de pelo menos 90cm',
      'Posicione móveis considerando pontos de tomada',
      'Use cores claras em espaços pequenos',
      'Considere ventilação natural em todos os cômodos',
    ];

    return {
      score: Math.min(100, score),
      strengths,
      improvements,
      recommendations,
    };
  }

  // Mock: Gerar layout otimizado
  private mockGenerateLayout(
    terrainWidth: number,
    terrainDepth: number
  ): {
    rooms: Room[];
    walls: Wall[];
    flowScore: number;
  } {
    const rooms: Room[] = [];
    const walls: Wall[] = [];

    // Layout básico otimizado
    const margin = 0.5;
    const availableWidth = terrainWidth - margin * 2;
    const availableDepth = terrainDepth - margin * 2;

    // Sala central
    const livingWidth = availableWidth * 0.5;
    const livingDepth = availableDepth * 0.5;
    rooms.push(this.createRoom('Sala de Estar', margin, margin, livingWidth, livingDepth, 'moderno'));

    // Cozinha ao lado
    rooms.push(this.createRoom('Cozinha', margin + livingWidth, margin, availableWidth * 0.5, livingDepth, 'moderno'));

    // Quartos na parte de trás
    const bedroomWidth = availableWidth / 3;
    rooms.push(this.createRoom('Suíte Principal', margin, margin + livingDepth, bedroomWidth, availableDepth * 0.5, 'moderno'));
    rooms.push(this.createRoom('Quarto 2', margin + bedroomWidth, margin + livingDepth, bedroomWidth, availableDepth * 0.5, 'moderno'));
    rooms.push(this.createRoom('Quarto 3', margin + bedroomWidth * 2, margin + livingDepth, bedroomWidth, availableDepth * 0.5, 'moderno'));

    // Gerar paredes
    rooms.forEach(room => {
      walls.push(...this.generateWallsForRoom(room));
    });

    return {
      rooms,
      walls,
      flowScore: 0.82,
    };
  }

  // Helpers
  private createRoom(
    name: string,
    x: number,
    y: number,
    width: number,
    depth: number,
    style: string
  ): Room {
    const colors: Record<string, string> = {
      moderno: '#F5F5F5',
      minimalista: '#FFFFFF',
      rustico: '#F5F5DC',
      industrial: '#E0E0E0',
      luxo: '#FFF8DC',
    };

    // Criar pontos do polígono do cômodo
    const points: Point[] = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + depth },
      { x, y: y + depth },
    ];

    return {
      id: uuidv4(),
      name,
      points,
      color: colors[style] || '#F5F5F5',
      floorMaterial: 'ceramic',
      area: width * depth,
    };
  }

  private generateWallsForRoom(room: Room): Wall[] {
    const walls: Wall[] = [];
    const wallThickness = 0.15;

    // Criar paredes a partir dos pontos do cômodo
    for (let i = 0; i < room.points.length; i++) {
      const start = room.points[i];
      const end = room.points[(i + 1) % room.points.length];

      walls.push({
        id: uuidv4(),
        start,
        end,
        thickness: wallThickness,
        height: 2.8,
        color: '#FFFFFF',
      });
    }

    return walls;
  }

  private generateRecommendations(style: string, roomCount: number): string[] {
    const recommendations: string[] = [
      'Posicione móveis considerando pontos de tomada e iluminação',
      'Mantenha corredores de circulação com no mínimo 90cm',
      'Use plantas para trazer vida aos espaços',
    ];

    if (style === 'moderno' || style === 'minimalista') {
      recommendations.push('Prefira linhas retas e cores neutras');
      recommendations.push('Invista em iluminação indireta');
    }

    if (style === 'rustico') {
      recommendations.push('Use materiais naturais como madeira e pedra');
      recommendations.push('Texturas são bem-vindas em ambientes rústicos');
    }

    if (roomCount >= 4) {
      recommendations.push('Considere criar uma área de integração entre sala e cozinha');
    }

    return recommendations;
  }
}

export const aiService = new AIService();
export default aiService;
