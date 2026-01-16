import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, G, Rect } from 'react-native-svg';

export interface LineChartDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  yAxisSuffix?: string;
  emptyMessage?: string;
}

export function LineChart({
  data,
  height = 200,
  color = '#FF4D00',
  showLabels = true,
  showGrid = true,
  yAxisSuffix = '%',
  emptyMessage = 'No data available',
}: LineChartProps) {
  const chartPadding = { top: 20, right: 10, bottom: 30, left: 40 };
  const chartWidth = 320;
  const chartHeight = height;

  const { pathD, points, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (data.length === 0) {
      return { pathD: '', points: [], yAxisLabels: [], xAxisLabels: [] };
    }

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 100);
    const range = maxValue - minValue || 1;

    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    const xStep = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth / 2;

    const pts = data.map((d, i) => {
      const x = chartPadding.left + (data.length > 1 ? i * xStep : innerWidth / 2);
      const y = chartPadding.top + innerHeight - ((d.value - minValue) / range) * innerHeight;
      return { x, y, value: d.value, label: d.label };
    });

    // Create smooth curve path
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }

    // Y-axis labels (0, 25, 50, 75, 100 for percentages)
    const yLabels = [0, 25, 50, 75, 100].map((val) => ({
      value: val,
      y: chartPadding.top + innerHeight - ((val - minValue) / range) * innerHeight,
    }));

    // X-axis labels (show first, middle, and last)
    const xLabels: { label: string; x: number }[] = [];
    if (data.length > 0) {
      xLabels.push({ label: formatDate(data[0].label), x: pts[0].x });
      if (data.length > 2) {
        const midIdx = Math.floor(data.length / 2);
        xLabels.push({ label: formatDate(data[midIdx].label), x: pts[midIdx].x });
      }
      if (data.length > 1) {
        xLabels.push({ label: formatDate(data[data.length - 1].label), x: pts[pts.length - 1].x });
      }
    }

    return { pathD: path, points: pts, yAxisLabels: yLabels, xAxisLabels: xLabels };
  }, [data, chartWidth, chartHeight]);

  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-xl">
        <Text className="text-text-muted text-body-sm">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grid lines */}
        {showGrid &&
          yAxisLabels.map((label, i) => (
            <Line
              key={`grid-${i}`}
              x1={chartPadding.left}
              y1={label.y}
              x2={chartWidth - chartPadding.right}
              y2={label.y}
              stroke="#333"
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}

        {/* Y-axis labels */}
        {showLabels &&
          yAxisLabels.map((label, i) => (
            <SvgText
              key={`y-label-${i}`}
              x={chartPadding.left - 8}
              y={label.y + 4}
              fontSize={10}
              fill="#888"
              textAnchor="end"
            >
              {label.value}
              {yAxisSuffix}
            </SvgText>
          ))}

        {/* Line path */}
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Area under the line */}
        <Path
          d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - chartPadding.bottom} L ${points[0].x} ${chartHeight - chartPadding.bottom} Z`}
          fill={color}
          fillOpacity={0.1}
        />

        {/* Data points */}
        {points.map((point, i) => (
          <Circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
            stroke="#1A1A1A"
            strokeWidth={2}
          />
        ))}

        {/* X-axis labels */}
        {showLabels &&
          xAxisLabels.map((label, i) => (
            <SvgText
              key={`x-label-${i}`}
              x={label.x}
              y={chartHeight - 8}
              fontSize={10}
              fill="#888"
              textAnchor="middle"
            >
              {label.label}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
