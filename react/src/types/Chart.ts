/* ── types ───────────────────────────────────────────────────── */

export interface Stage {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  values: number[];
}

export interface ThemeTokens {
  svgBg: string;
  unfilled: string;
  separator: string;
  radialDiv: string;
  labelFill: string;
  labelShadow: string;
  centerFill: string;
  centerStroke: string;
  centerIcon: string;
  teamLabelDim: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipSub: string;
  panelBg: string;
  panelBorder: string;
  panelText: string;
  panelMuted: string;
  panelFaint: string;
  inputBg: string;
  inputBorder: string;
  cardBg: string;
  cardBorder: string;
  toggleBg: string;
  toggleText: string;
}

export interface TooltipState {
  svgX: number;
  svgY: number;
  teamColor: string;
  team: string;
  stage: string;
  val: number;
}
