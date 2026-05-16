export type NodeType = 'power' | 'mcu' | 'sensor' | 'module' | 'display' | 'actuator' | 'safety' | 'switch';

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  stripe: string;
  cost?: number;
  dims?: string;
  product?: string;
  desc: string;
  pins?: string[];
  img: string;
  buy?: string;
  rules?: string[];
  isNew?: boolean;
  isFixed?: boolean;
  newNote?: string;
  fixNote?: string;
  duty?: string;
  purpose?: string;
  fullName?: string;
  procurement?: 'bought' | 'made';
  x: number;
  y: number;
  x3?: number;
  y3?: number;
  z3?: number;
}

export type EdgeType = 'edge-12v' | 'edge-5v' | 'edge-can' | 'edge-analog' | 'edge-pwm' | 'edge-digital' | 'edge-i2c' | 'edge-sdc' | 'edge-hw';

export interface Edge {
  s: string;
  t: string;
  cls: EdgeType;
  lbl: string;
}
