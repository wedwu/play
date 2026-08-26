type ProjectColor = "#4f46e5" | "#0ea5e9" | "#10b981" | "#f59e0b" | "#ef4444";

export interface Project {
  id: number;
  label: string;
  value: number;
  color: ProjectColor;
}
