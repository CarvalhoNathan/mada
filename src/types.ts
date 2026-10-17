export interface Operator {
  name: string;
  role: string;
  avatar: string;
}

export interface PieceLot {
  title: string;
  qty: string;
  substrate: string;
  area: string;
  estVolume: string;
}

export interface RecipeState {
  totalVolume: number;
  proportions: {
    base: number;
    catalisador: number;
    diluidor: number;
    retardador: number;
  };
  densities: {
    base: number;
    catalisador: number;
    diluidor: number;
    retardador: number;
  };
}

export type ScreenId = 'auth' | 'dashboard' | 'os' | 'recipe' | 'return';
