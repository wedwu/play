interface DoughnutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DoughnutChartProps {
  segments: DoughnutSegment[];
  size?: number;
  label?: string;
}
