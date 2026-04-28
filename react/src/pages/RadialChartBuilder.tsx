import { DEF_STAGES, DEF_TEAMS, PALETTE, THEME } from "@/const";
import { arcPath, ptc } from "@/helpers/radialChart";
import type { Stage, Team, ThemeTokens, TooltipState } from "@/types";
import { useState, useCallback, useEffect, useRef, type CSSProperties } from "react";

type PanelTab = "teams" | "stages";

const RadialChartBuilder = () => {
  const [stages, setStages] = useState<Stage[]>(DEF_STAGES);
  const [teams, setTeams] = useState<Team[]>(DEF_TEAMS);
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [panel, setPanel] = useState<PanelTab>("teams");
  const [dark, setDark] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : true
  );
  const [size, setSize] = useState(800);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const s = Math.floor(Math.min(width, height));
      if (s > 0) setSize(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const T: ThemeTokens = dark ? THEME.dark : THEME.light;

  /* chart geometry */
  const S = 800,
    CX = S / 2,
    CY = S / 2;
  const MIN_R = 52,
    MAX_R = 228;
  const RING_W = (MAX_R - MIN_R) / Math.max(stages.length, 1);
  const TEAM_GAP = 0.018;
  const EACH = (2 * Math.PI) / Math.max(teams.length, 1);

  const ringR = (si: number): [number, number] => [MAX_R - (si + 1) * RING_W, MAX_R - si * RING_W];
  const teamA = (ti: number): [number, number] => [
    -Math.PI / 2 + ti * EACH + TEAM_GAP / 2,
    -Math.PI / 2 + (ti + 1) * EACH - TEAM_GAP / 2,
  ];

  /* state helpers */
  const clamp = (v: string): number => Math.max(0, Math.min(100, parseFloat(v) || 0));

  const setVal = useCallback((tid: string, si: number, v: string): void => {
    setTeams((p: Team[]) =>
      p.map((t: Team) =>
        t.id === tid
          ? { ...t, values: t.values.map((x: number, i: number) => (i === si ? clamp(v) : x)) }
          : t
      )
    );
  }, []);

  const setClr = useCallback((tid: string, c: string): void => {
    setTeams((p: Team[]) => p.map((t: Team) => (t.id === tid ? { ...t, color: c } : t)));
  }, []);

  const setNm = useCallback((tid: string, n: string): void => {
    setTeams((p: Team[]) => p.map((t: Team) => (t.id === tid ? { ...t, name: n } : t)));
  }, []);

  const setStNm = useCallback((sid: string, n: string): void => {
    setStages((p: Stage[]) => p.map((s: Stage) => (s.id === sid ? { ...s, name: n } : s)));
  }, []);

  const addTeam = (): void =>
    setTeams((p: Team[]) => [
      ...p,
      {
        id: uid(),
        name: `Team ${p.length + 1}`,
        color: PALETTE[p.length % PALETTE.length],
        values: stages.map((_: Stage, i: number) => Math.max(0, 100 - i * 18)),
      },
    ]);

  const delTeam = (id: string): void => {
    setTeams((p: Team[]) => p.filter((t: Team) => t.id !== id));
    if (activeTeam === id) setActiveTeam(null);
  };

  const addStage = (): void => {
    setStages((p: Stage[]) => [...p, { id: uid(), name: `Stage ${p.length + 1}` }]);
    setTeams((p: Team[]) => p.map((t: Team) => ({ ...t, values: [...t.values, 0] })));
  };

  const delStage = (i: number): void => {
    if (stages.length <= 2) return;
    setStages((p: Stage[]) => p.filter((_: Stage, j: number) => j !== i));
    setTeams((p: Team[]) =>
      p.map((t: Team) => ({ ...t, values: t.values.filter((_: number, j: number) => j !== i) }))
    );
  };

  /* shared styles */
  const inp: CSSProperties = {
    fontSize: 12,
    padding: "3px 6px",
    border: `0.5px solid ${T.inputBorder}`,
    borderRadius: 6,
    background: T.inputBg,
    color: T.panelText,
    fontFamily: "var(--font-sans)",
    outline: "none",
  };

  const btn: CSSProperties = {
    fontSize: 11,
    padding: "3px 10px",
    cursor: "pointer",
    border: `0.5px solid ${T.panelBorder}`,
    borderRadius: 6,
    background: "transparent",
    color: T.panelMuted,
    fontFamily: "var(--font-sans)",
  };

  return (
    <div
      style={{
        display: "flex",
        fontFamily: "var(--font-sans)",
        background: T.panelBg,
        transition: "background 0.2s",
      }}
    >
      {/* ── chart ── */}
      <div ref={chartRef} style={{ flex: 1, minWidth: 0, alignSelf: "stretch" }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${S} ${S}`}
          style={{ display: "block", background: T.svgBg, transition: "background 0.2s" }}
        >
          <defs>
            <filter id="lbl-shadow" x="-60%" y="-60%" width="220%" height="220%">
              <feFlood floodColor={T.labelShadow} floodOpacity="1" result="flood" />
              <feComposite in="flood" in2="SourceGraphic" operator="in" result="mask" />
              <feMorphology in="SourceGraphic" operator="dilate" radius="2" result="dilated" />
              <feFlood floodColor={T.labelShadow} floodOpacity="0.8" result="shadowColor" />
              <feComposite in="shadowColor" in2="dilated" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* team arcs */}
          {teams.map((team: Team, ti: number) => {
            const [a1, a2] = teamA(ti);
            const isActive = activeTeam === team.id;
            const dimmed = activeTeam !== null && !isActive;
            return stages.map((stage: Stage, si: number) => {
              const [r1, r2] = ringR(si);
              const val = team.values[si] ?? 0;
              const fillA = a1 + (val / 100) * (a2 - a1);
              const midA = (a1 + a2) / 2;
              const midR = (r1 + r2) / 2;
              const [lx, ly] = ptc(CX, CY, midR, midA);
              const arcLen = midR * (a2 - a1);
              const showPct = arcLen > 20 && RING_W > 14;
              return (
                <g
                  key={`${team.id}-${si}`}
                  onMouseEnter={() =>
                    setTooltip({
                      svgX: lx,
                      svgY: ly,
                      teamColor: team.color,
                      team: team.name,
                      stage: stage.name,
                      val,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => setActiveTeam(isActive ? null : team.id)}
                  style={{ cursor: "pointer" }}
                >
                  <path
                    d={arcPath(CX, CY, r1, r2, a1, a2)}
                    fill={T.unfilled}
                    opacity={dimmed ? 0.4 : 1}
                  />
                  {val > 0.5 && (
                    <path
                      d={arcPath(CX, CY, r1, r2, a1, fillA)}
                      fill={team.color}
                      opacity={dimmed ? 0.25 : 1}
                    />
                  )}
                  {showPct && (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.min(11, RING_W * 0.38)}
                      fontWeight="700"
                      fill={T.labelFill}
                      filter="url(#lbl-shadow)"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {val}%
                    </text>
                  )}
                </g>
              );
            });
          })}

          {/* ring separators */}
          {stages.map((_: Stage, si: number) => {
            const [, r2] = ringR(si);
            return (
              <circle
                key={`r${si}`}
                cx={CX}
                cy={CY}
                r={r2}
                fill="none"
                stroke={T.separator}
                strokeWidth={2.5}
              />
            );
          })}
          <circle cx={CX} cy={CY} r={MIN_R} fill="none" stroke={T.separator} strokeWidth={2.5} />

          {/* radial dividers */}
          {teams.map((_: Team, ti: number) => {
            const [a1] = teamA(ti);
            const [x1, y1] = ptc(CX, CY, MIN_R, a1);
            const [x2, y2] = ptc(CX, CY, MAX_R, a1);
            return (
              <line
                key={`d${ti}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={T.radialDiv}
                strokeWidth={1}
              />
            );
          })}

          {/* stage name labels */}
          {stages.map((stage: Stage, si: number) => {
            const [r1, r2] = ringR(si);
            const midR = (r1 + r2) / 2;
            return (
              <text
                key={`sl-${stage.id}`}
                x={CX}
                y={CY - midR}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={si === 0 ? 13 : 11}
                fontWeight="700"
                fill={T.labelFill}
                filter="url(#lbl-shadow)"
                style={{ pointerEvents: "none", userSelect: "none", letterSpacing: "0.01em" }}
              >
                {stage.name}
              </text>
            );
          })}

          {/* team labels outside ring */}
          {teams.map((team: Team, ti: number) => {
            const [a1, a2] = teamA(ti);
            const midA = (a1 + a2) / 2;
            const [lx, ly] = ptc(CX, CY, MAX_R + 18, midA);
            const deg = (midA * 180) / Math.PI + 90;
            const flip = midA > 0 && midA < Math.PI;
            const arcLen = MAX_R * (a2 - a1);
            if (arcLen < 14) return null;
            const isActive = activeTeam === team.id;
            return (
              <text
                key={`tl-${team.id}`}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8.5}
                fontWeight={isActive ? 700 : 500}
                fill={isActive ? team.color : T.teamLabelDim}
                transform={`rotate(${flip ? deg + 180 : deg},${lx},${ly})`}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {team.name.length > 9 ? `${team.name.slice(0, 8)}…` : team.name}
              </text>
            );
          })}

          {/* center */}
          <circle
            cx={CX}
            cy={CY}
            r={MIN_R - 1}
            fill={T.centerFill}
            stroke={T.centerStroke}
            strokeWidth={2}
          />
          <circle
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={28}
            style={{ userSelect: "none" }}
          >
            <img
              src="/stanley-cup-old.png"
              alt="Logo"
              style={{ width: 24, height: 24, verticalAlign: "middle" }}
            />
          </circle>

          {/* tooltip */}
          {tooltip &&
            (() => {
              const tw = 106,
                th = 42;
              const bx = Math.max(4, Math.min(S - tw - 4, tooltip.svgX - tw / 2));
              const by = Math.max(4, tooltip.svgY - th - 10);
              return (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={bx}
                    y={by}
                    width={tw}
                    height={th}
                    rx={5}
                    fill={T.tooltipBg}
                    stroke={T.tooltipBorder}
                    strokeWidth={0.5}
                  />
                  <rect x={bx} y={by} width={7} height={th} rx={5} fill={tooltip.teamColor} />
                  <rect x={bx + 2} y={by} width={5} height={th} fill={tooltip.teamColor} />
                  <text x={bx + 14} y={by + 14} fontSize={10} fontWeight="600" fill={T.tooltipText}>
                    {tooltip.team}
                  </text>
                  <text x={bx + 14} y={by + 28} fontSize={9} fill={T.tooltipSub}>
                    {tooltip.stage}: {tooltip.val}%
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>

      {/* ── controls ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          borderLeft: `0.5px solid ${T.panelBorder}`,
          maxHeight: size,
          overflow: "hidden",
          background: T.panelBg,
          transition: "background 0.2s",
        }}
      >
        {/* tabs + theme toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderBottom: `0.5px solid ${T.panelBorder}`,
            flexShrink: 0,
          }}
        >
          {(["teams", "stages"] as PanelTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setPanel(t)}
              style={{
                flex: 1,
                fontSize: 11,
                padding: "8px 0",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                color: panel === t ? T.panelText : T.panelMuted,
                fontWeight: panel === t ? 500 : 400,
                borderBottom: panel === t ? `2px solid ${T.panelText}` : "2px solid transparent",
                fontFamily: "var(--font-sans)",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setDark((d: boolean) => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              padding: "0 12px",
              cursor: "pointer",
              border: "none",
              background: "transparent",
              fontSize: 15,
              color: T.panelMuted,
              flexShrink: 0,
              borderLeft: `0.5px solid ${T.panelBorder}`,
            }}
          >
            {dark ? "☀" : "☾"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {/* stages panel */}
          {panel === "stages" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 10, color: T.panelMuted, fontWeight: 500 }}>
                  OUTER → INNER
                </span>
                <button style={btn} onClick={addStage}>
                  + Add
                </button>
              </div>
              {stages.map((s: Stage, i: number) => (
                <div
                  key={s.id}
                  style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}
                >
                  <span
                    style={{ fontSize: 10, color: T.panelFaint, minWidth: 14, textAlign: "right" }}
                  >
                    {i + 1}
                  </span>
                  <input
                    value={s.name}
                    onChange={(e) => setStNm(s.id, e.target.value)}
                    style={{ ...inp, flex: 1 }}
                  />
                  <button
                    onClick={() => delStage(i)}
                    disabled={stages.length <= 2}
                    style={{
                      ...btn,
                      fontSize: 10,
                      padding: "2px 6px",
                      color: "#ef4444",
                      borderColor: "transparent",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* teams panel */}
          {panel === "teams" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 10, color: T.panelMuted, fontWeight: 500 }}>
                  {teams.length} TEAMS
                </span>
                <button style={btn} onClick={addTeam}>
                  + Add
                </button>
              </div>
              {teams.map((team: Team) => {
                const isAct = activeTeam === team.id;
                return (
                  <div
                    key={team.id}
                    onClick={() => setActiveTeam(isAct ? null : team.id)}
                    style={{
                      marginBottom: 6,
                      padding: "7px 8px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `0.5px solid ${isAct ? team.color : T.cardBorder}`,
                      background: isAct ? `${team.color}22` : T.cardBg,
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 5 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: team.color,
                          flexShrink: 0,
                          border: `0.5px solid ${T.cardBorder}`,
                        }}
                      />
                      <input
                        value={team.name}
                        onChange={(e) => setNm(team.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ ...inp, flex: 1, fontWeight: 500, fontSize: 11 }}
                      />
                      <input
                        type="color"
                        value={team.color}
                        onChange={(e) => setClr(team.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        title="Color"
                        style={{
                          width: 20,
                          height: 20,
                          padding: 0,
                          border: `0.5px solid ${T.inputBorder}`,
                          borderRadius: 4,
                          cursor: "pointer",
                          background: "transparent",
                          flexShrink: 0,
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          delTeam(team.id);
                        }}
                        style={{
                          ...btn,
                          fontSize: 10,
                          padding: "1px 4px",
                          color: "#ef4444",
                          borderColor: "transparent",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${stages.length},1fr)`,
                        gap: 3,
                      }}
                    >
                      {stages.map((stage: Stage, si: number) => (
                        <div
                          key={stage.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            gap: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 8,
                              color: T.panelFaint,
                              textAlign: "center",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {stage.name.split(" ").slice(0, 2).join(" ")}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={team.values[si] ?? 0}
                            onChange={(e) => setVal(team.id, si, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              ...inp,
                              textAlign: "center",
                              padding: "3px 1px",
                              fontSize: 11,
                              borderColor: isAct ? `${team.color}99` : T.inputBorder,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{ padding: "6px 10px", borderTop: `0.5px solid ${T.panelBorder}`, flexShrink: 0 }}
        >
          <span style={{ fontSize: 10, color: T.panelFaint }}>
            Click a team to highlight · hover arcs for details
          </span>
        </div>
      </div>
    </div>
  );
};

export default RadialChartBuilder;
function uid(): string {
  throw new Error("Function not implemented.");
}
