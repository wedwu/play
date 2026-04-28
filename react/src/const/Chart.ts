/* ── constants ───────────────────────────────────────────────── */

import type { Stage, Team, ThemeTokens } from "@/types/Chart";

export const PALETTE: readonly string[] = [
  "#6B2A3A",
  "#CC0000",
  "#C8A900",
  "#CFC000",
  "#F47A38",
  "#003087",
  "#002B5C",
  "#AF1E2D",
  "#FF4C00",
  "#B4975A",
  "#154734",
  "#006847",
  "#888888",
  "#8B0000",
];

let _uid = 0;
const uid = (): string => `id_${++_uid}`;
export const PanelTab: readonly ["teams", "stages"] = ["teams", "stages"];

export const DEF_STAGES: Stage[] = [
  { id: uid(), name: "Make Playoffs" },
  { id: uid(), name: "Make 2nd Round" },
  { id: uid(), name: "Make 3rd Round" },
  { id: uid(), name: "Make Finals" },
  { id: uid(), name: "Win Cup" },
];

export const DEF_TEAMS: Team[] = [
  { id: uid(), name: "Colorado", color: "#6B2A3A", values: [100, 79, 45, 26, 14] },
  { id: uid(), name: "Carolina", color: "#CC0000", values: [100, 84, 56, 31, 17] },
  { id: uid(), name: "Ottawa", color: "#C8A900", values: [100, 100, 16, 9, 7] },
  { id: uid(), name: "Pittsburgh", color: "#CFC000", values: [100, 100, 19, 7, 4] },
  { id: uid(), name: "Philly", color: "#F47A38", values: [100, 81, 28, 6, 5] },
  { id: uid(), name: "Buffalo", color: "#003087", values: [100, 68, 16, 8, 4] },
  { id: uid(), name: "Tampa Bay", color: "#002B5C", values: [100, 100, 61, 39, 20] },
  { id: uid(), name: "Montreal", color: "#AF1E2D", values: [100, 100, 26, 18, 10] },
  { id: uid(), name: "Anaheim", color: "#FC4C02", values: [100, 27, 10, 5, 3] },
  { id: uid(), name: "Edmonton", color: "#FF4C00", values: [100, 73, 31, 13, 6] },
  { id: uid(), name: "Vegas", color: "#B4975A", values: [100, 73, 45, 23, 12] },
  { id: uid(), name: "New Jersey", color: "#CE1126", values: [100, 27, 14, 6, 3] },
  { id: uid(), name: "Minnesota", color: "#154734", values: [100, 53, 25, 12, 6] },
  { id: uid(), name: "Dallas", color: "#006847", values: [100, 47, 22, 10, 5] },
  { id: uid(), name: "LA Kings", color: "#888888", values: [100, 100, 21, 8, 3] },
];

export const THEME: Record<"dark" | "light", ThemeTokens> = {
  dark: {
    svgBg: "#18181b",
    unfilled: "#111111",
    separator: "#ffffff",
    radialDiv: "#ffffff",
    labelFill: "#ffffff",
    labelShadow: "rgba(0,0,0,0.9)",
    centerFill: "#27272a",
    centerStroke: "#ffffff",
    centerIcon: "#ffffff",
    teamLabelDim: "#a1a1aa",
    tooltipBg: "#27272a",
    tooltipBorder: "#52525b",
    tooltipText: "#f4f4f5",
    tooltipSub: "#a1a1aa",
    panelBg: "#18181b",
    panelBorder: "#3f3f46",
    panelText: "#f4f4f5",
    panelMuted: "#a1a1aa",
    panelFaint: "#71717a",
    inputBg: "#27272a",
    inputBorder: "#3f3f46",
    cardBg: "#27272a",
    cardBorder: "#3f3f46",
    toggleBg: "#3f3f46",
    toggleText: "#f4f4f5",
  },
  light: {
    svgBg: "#ffffff",
    unfilled: "#d4d4d8",
    separator: "#ffffff",
    radialDiv: "#ffffff",
    labelFill: "#18181b",
    labelShadow: "rgba(255,255,255,0.85)",
    centerFill: "#ffffff",
    centerStroke: "#d4d4d8",
    centerIcon: "#18181b",
    teamLabelDim: "#52525b",
    tooltipBg: "#ffffff",
    tooltipBorder: "#d4d4d8",
    tooltipText: "#18181b",
    tooltipSub: "#71717a",
    panelBg: "#ffffff",
    panelBorder: "#e4e4e7",
    panelText: "#18181b",
    panelMuted: "#52525b",
    panelFaint: "#a1a1aa",
    inputBg: "#ffffff",
    inputBorder: "#d4d4d8",
    cardBg: "#f4f4f5",
    cardBorder: "#e4e4e7",
    toggleBg: "#e4e4e7",
    toggleText: "#18181b",
  },
};
