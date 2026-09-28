/**
 * Geometría del piso, deducida del croquis a mano.
 *
 * Cotas escritas en el croquis:
 *   3,61 m  ancho hors-tout        3,32 m  ancho interior
 *   2,93 m  fondo del cuarto       5,25 m  del tabique del cuarto al muro sur
 *
 * 3,61 − 3,32 = 0,29 = dos muros de fachada de 0,145 m.
 * Los 5,25 m se reparten en 1,38 (baño y pasillo) + 3,19 (sala) + 0,68 (cocina).
 *
 * Todas las medidas en metros. Eje X = ancho, Z = largo (norte arriba), Y = altura.
 */

export const WE = 0.145; // muro exterior
export const WI = 0.1; // tabique interior
export const H = 2.5; // altura libre (no acotada en el croquis)

export const X0 = 0;
export const X1 = 3.61;
export const XI0 = X0 + WE; // 0,145
export const XI1 = X1 - WE; // 3,465  → 3,32 m interiores

export const Z0 = 0;
export const ZI0 = Z0 + WE; // 0,145
export const ZC1 = ZI0 + 2.93; // 3,075  fondo del cuarto
export const ZP = ZC1 + WI; // 3,175  cara interior del tabique
export const ZB1 = ZP + 1.28; // 4,455  fondo interior del baño
export const ZB2 = ZB1 + WI; // 4,555  fin de la banda baño/pasillo (1,38)
export const ZS2 = ZB2 + 3.19; // 7,745  fin de la sala
export const ZK2 = ZS2 + 0.68; // 8,425  cara interior del muro sur (5,25 desde ZP)
export const Z1 = ZK2 + WE; // 8,570  hors-tout

export const XH1 = XI0 + 1.08; // 1,225  cara oeste del tabique del baño
export const XH2 = XH1 + WI; // 1,325  cara este   → baño de 2,14 m

export const CX = (X0 + X1) / 2;
export const CZ = (Z0 + Z1) / 2;

/** Puerta del cuarto: el único hueco dibujado en el croquis. */
export const DOOR_H = 2.05;
export const DW = 0.95;

/** Puerta del baño: no está dibujada, es una decisión de proyecto. */
export const BDZ0 = ZP + 0.42;
export const BDZ1 = BDZ0 + 0.7;

/** Nueva ventana trazada contra el muro este. Alturas supuestas. */
export const WZ0 = ZP + 2.16;
export const WZ1 = WZ0 + 1.99;
export const WSILL = 1.0;
export const WHEAD = 2.2;

export type RoomKey = 'cuarto' | 'bano' | 'pasillo' | 'sala' | 'cocina';

export interface Room {
  key: RoomKey;
  name: string;
  w: number;
  d: number;
  a: number;
  /** Tinta de plano, usada en el modo «obra bruta» y en la leyenda. */
  plan: number;
  /** Acabado real, usado en el modo «amueblado». */
  finish: number;
  cx: number;
  cz: number;
}

const ROBLE = 0xc2995f;
const MICRO = 0x8c9499;

export const ROOMS: Room[] = [
  { key: 'cuarto', name: 'Cuarto', w: 3.32, d: 2.93, a: 9.73, plan: 0xc8a87e, finish: ROBLE, cx: (XI0 + XI1) / 2, cz: (ZI0 + ZC1) / 2 },
  { key: 'bano', name: 'Baño', w: 2.14, d: 1.28, a: 2.74, plan: 0x8ea8b6, finish: MICRO, cx: (XH2 + XI1) / 2, cz: (ZP + ZB1) / 2 },
  { key: 'pasillo', name: 'Pasillo', w: 1.08, d: 1.38, a: 1.49, plan: 0xb5b0a4, finish: ROBLE, cx: (XI0 + XH1) / 2, cz: (ZP + ZB2) / 2 },
  { key: 'sala', name: 'Sala', w: 3.32, d: 3.19, a: 10.59, plan: 0xd6b98e, finish: ROBLE, cx: (XI0 + XI1) / 2, cz: (ZB2 + ZS2) / 2 },
  { key: 'cocina', name: 'Cocina abierta', w: 3.32, d: 0.68, a: 2.26, plan: 0x99a3aa, finish: MICRO, cx: (XI0 + XI1) / 2, cz: (ZS2 + ZK2) / 2 },
];

export const TOTAL_AREA = ROOMS.reduce((sum, r) => sum + r.a, 0); // 26,81 con el pasillo aparte

/** Color convencional de obra nueva. */
export const OBRA = 0xc23b1e;
