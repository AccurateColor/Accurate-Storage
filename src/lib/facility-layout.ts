/**
 * Static floor-plan positions for the two buildings, transcribed from
 * Callie's facility map (`../Accurate Storage Station/facility map.webp`).
 * Deliberately NOT stored in the database — this is presentation-layer
 * geometry, not business data (unit size/rate/status live in `units`, keyed
 * by unit_number; this file only says WHERE each unit_number sits on the
 * lot). Positions are current as of 2026-08-26; SIZES on the source map
 * are pre-renovation and no longer trusted (see units.notes on each row)
 * — do not infer size from this file.
 *
 * Grid math: each building is one CSS grid. Building A alternates between
 * "paired" rows (a single tall cell in column 1 beside two stacked half-
 * height cells in column 2) and full-width single cells — modeled by
 * giving every row a HALF-unit height and having tall cells span two grid
 * rows. Building B is uniform pairs down both columns until the bottom
 * row, which splits into five narrow columns — modeled with a 10-column
 * grid so a normal pair is 5+5 and a narrow cell is 2 columns wide.
 */

export type LayoutCell = {
  unitNumber: string;
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
};

export const BUILDING_A_COLUMNS = 2;
export const BUILDING_A_ROWS = 24;

export const BUILDING_A_LAYOUT: LayoutCell[] = [
  { unitNumber: "A-13", colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 3 },
  { unitNumber: "A-14", colStart: 2, colEnd: 3, rowStart: 1, rowEnd: 3 },
  { unitNumber: "A-15", colStart: 1, colEnd: 3, rowStart: 3, rowEnd: 5 },
  { unitNumber: "A-11", colStart: 1, colEnd: 2, rowStart: 5, rowEnd: 7 },
  { unitNumber: "A-16", colStart: 2, colEnd: 3, rowStart: 5, rowEnd: 6 },
  { unitNumber: "A-17", colStart: 2, colEnd: 3, rowStart: 6, rowEnd: 7 },
  { unitNumber: "A-10", colStart: 1, colEnd: 2, rowStart: 7, rowEnd: 9 },
  { unitNumber: "A-18", colStart: 2, colEnd: 3, rowStart: 7, rowEnd: 8 },
  { unitNumber: "A-19", colStart: 2, colEnd: 3, rowStart: 8, rowEnd: 9 },
  { unitNumber: "A-9", colStart: 1, colEnd: 2, rowStart: 9, rowEnd: 11 },
  { unitNumber: "A-20", colStart: 2, colEnd: 3, rowStart: 9, rowEnd: 10 },
  { unitNumber: "A-21", colStart: 2, colEnd: 3, rowStart: 10, rowEnd: 11 },
  { unitNumber: "A-8", colStart: 1, colEnd: 2, rowStart: 11, rowEnd: 13 },
  { unitNumber: "A-22", colStart: 2, colEnd: 3, rowStart: 11, rowEnd: 12 },
  { unitNumber: "A-23", colStart: 2, colEnd: 3, rowStart: 12, rowEnd: 13 },
  { unitNumber: "A-7", colStart: 1, colEnd: 2, rowStart: 13, rowEnd: 15 },
  { unitNumber: "A-24", colStart: 2, colEnd: 3, rowStart: 13, rowEnd: 14 },
  { unitNumber: "A-25", colStart: 2, colEnd: 3, rowStart: 14, rowEnd: 15 },
  { unitNumber: "A-6", colStart: 1, colEnd: 2, rowStart: 15, rowEnd: 17 },
  { unitNumber: "A-26", colStart: 2, colEnd: 3, rowStart: 15, rowEnd: 16 },
  { unitNumber: "A-27", colStart: 2, colEnd: 3, rowStart: 16, rowEnd: 17 },
  { unitNumber: "A-5", colStart: 1, colEnd: 2, rowStart: 17, rowEnd: 19 },
  { unitNumber: "A-28", colStart: 2, colEnd: 3, rowStart: 17, rowEnd: 18 },
  { unitNumber: "A-29", colStart: 2, colEnd: 3, rowStart: 18, rowEnd: 19 },
  { unitNumber: "A-30", colStart: 2, colEnd: 3, rowStart: 19, rowEnd: 20 },
  { unitNumber: "A-31", colStart: 2, colEnd: 3, rowStart: 20, rowEnd: 21 },
  { unitNumber: "A-36", colStart: 2, colEnd: 3, rowStart: 21, rowEnd: 25 },
];

/** Not a rentable unit — Callie's own Accurate Color LLC space. Rendered, never clickable/editable. */
export const BUILDING_A_NON_RENTABLE = {
  label: "Accurate Color LLC",
  colStart: 1,
  colEnd: 2,
  rowStart: 19,
  rowEnd: 25,
};

export const BUILDING_B_COLUMNS = 10;
export const BUILDING_B_ROWS = 13;

export const BUILDING_B_LAYOUT: LayoutCell[] = [
  { unitNumber: "B-12", colStart: 1, colEnd: 6, rowStart: 1, rowEnd: 2 },
  { unitNumber: "B-13", colStart: 6, colEnd: 11, rowStart: 1, rowEnd: 2 },
  { unitNumber: "B-11", colStart: 1, colEnd: 6, rowStart: 2, rowEnd: 3 },
  { unitNumber: "B-14", colStart: 6, colEnd: 11, rowStart: 2, rowEnd: 3 },
  { unitNumber: "B-10", colStart: 1, colEnd: 6, rowStart: 3, rowEnd: 4 },
  { unitNumber: "B-15", colStart: 6, colEnd: 11, rowStart: 3, rowEnd: 4 },
  { unitNumber: "B-9", colStart: 1, colEnd: 6, rowStart: 4, rowEnd: 5 },
  { unitNumber: "B-16", colStart: 6, colEnd: 11, rowStart: 4, rowEnd: 5 },
  { unitNumber: "B-8", colStart: 1, colEnd: 6, rowStart: 5, rowEnd: 6 },
  { unitNumber: "B-17", colStart: 6, colEnd: 11, rowStart: 5, rowEnd: 6 },
  { unitNumber: "B-7", colStart: 1, colEnd: 6, rowStart: 6, rowEnd: 7 },
  { unitNumber: "B-18", colStart: 6, colEnd: 11, rowStart: 6, rowEnd: 7 },
  { unitNumber: "B-6", colStart: 1, colEnd: 6, rowStart: 7, rowEnd: 8 },
  { unitNumber: "B-19", colStart: 6, colEnd: 11, rowStart: 7, rowEnd: 8 },
  { unitNumber: "B-5", colStart: 1, colEnd: 6, rowStart: 8, rowEnd: 9 },
  { unitNumber: "B-20", colStart: 6, colEnd: 11, rowStart: 8, rowEnd: 9 },
  { unitNumber: "B-4", colStart: 1, colEnd: 6, rowStart: 9, rowEnd: 10 },
  { unitNumber: "B-21", colStart: 6, colEnd: 11, rowStart: 9, rowEnd: 10 },
  { unitNumber: "B-3", colStart: 1, colEnd: 6, rowStart: 10, rowEnd: 11 },
  { unitNumber: "B-22", colStart: 6, colEnd: 11, rowStart: 10, rowEnd: 11 },
  { unitNumber: "B-2", colStart: 1, colEnd: 6, rowStart: 11, rowEnd: 12 },
  { unitNumber: "B-23", colStart: 6, colEnd: 11, rowStart: 11, rowEnd: 12 },
  { unitNumber: "B-1", colStart: 1, colEnd: 6, rowStart: 12, rowEnd: 13 },
  { unitNumber: "B-24", colStart: 6, colEnd: 11, rowStart: 12, rowEnd: 13 },
  { unitNumber: "B-29", colStart: 1, colEnd: 3, rowStart: 13, rowEnd: 14 },
  { unitNumber: "B-28", colStart: 3, colEnd: 5, rowStart: 13, rowEnd: 14 },
  { unitNumber: "B-27", colStart: 5, colEnd: 7, rowStart: 13, rowEnd: 14 },
  { unitNumber: "B-26", colStart: 7, colEnd: 9, rowStart: 13, rowEnd: 14 },
  { unitNumber: "B-25", colStart: 9, colEnd: 11, rowStart: 13, rowEnd: 14 },
];
