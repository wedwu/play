import type { Property } from "csstype";
import { useState } from "react";
import { btn, inp } from "../../styles";
import type { PanelTab, Stage, Team } from "../../types";

const Controls = (S: any, T: { panelBorder: any; panelBg: any; panelText: string | (string & {}) | undefined; panelMuted: string | (string & {}) | undefined; panelFaint: any; cardBorder: any; cardBg: Property.Background<string | number> | undefined; inputBorder: string | (string & {}) | undefined; }, panel: string, dark: any) => {
  const { stages = [], teams = [], activeTeam = null, setPanel, setDark, addStage, delStage, setStNm, addTeam, delTeam, setNm, setClr, setActiveTeam, setVal } = S || {};

  if (!setPanel || !setDark) {
    function setPanel(t: PanelTab): void {
      throw new Error("Function not implemented.");
    }

    function setDark(arg0: (d: boolean) => boolean): void {
      throw new Error("Function not implemented.");
    }

    function addStage(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
      throw new Error("Function not implemented.");
    }
  }

return (<div
  style={{
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    borderLeft: `0.5px solid ${T.panelBorder}`,
    maxHeight: S,
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
          <span style={{ fontSize: 10, color: T.panelMuted, fontWeight: 500 }}>OUTER → INNER</span>
          <button style={btn} onClick={addStage}>
            + Add
          </button>
        </div>
        {stages.map((s: Stage, i: number) => (
          <div
            key={s.id}
            style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}
          >
            <span style={{ fontSize: 10, color: T.panelFaint, minWidth: 14, textAlign: "right" }}>
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

  <div style={{ padding: "6px 10px", borderTop: `0.5px solid ${T.panelBorder}`, flexShrink: 0 }}>
    <span style={{ fontSize: 10, color: T.panelFaint }}>
      Click a team to highlight · hover arcs for details
    </span>
  </div>
</div>;
)
export default Controls;