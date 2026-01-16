import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';

export interface HeatmapDataPoint {
  row: number;
  col: number;
  value: number;
  label?: string;
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  rows: number;
  cols: number;
  rowLabels?: string[];
  colLabels?: string[];
  height?: number;
  colorScale?: string[];
  emptyMessage?: string;
}

const DEFAULT_COLOR_SCALE = [
  '#1A1A1A', // 0 - no activity
  '#3D1A00', // 1-20%
  '#662B00', // 21-40%
  '#8C3B00', // 41-60%
  '#B34D00', // 61-80%
  '#FF4D00', // 81-100%
];

export function HeatmapChart({
  data,
  rows,
  cols,
  rowLabels = [],
  colLabels = [],
  height = 200,
  colorScale = DEFAULT_COLOR_SCALE,
  emptyMessage = 'No data available',
}: HeatmapChartProps) {
  const chartPadding = { top: 25, right: 10, bottom: 10, left: 35 };
  const chartWidth = 320;
  const chartHeight = height;

  const { cells, maxValue } = useMemo(() => {
    if (data.length === 0) {
      return { cells: [], maxValue: 0 };
    }

    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);

    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    const cellWidth = innerWidth / cols - 2;
    const cellHeight = innerHeight / rows - 2;

    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    data.forEach((d) => {
      dataMap.set(`${d.row}-${d.col}`, d.value);
    });

    const allCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const value = dataMap.get(`${r}-${c}`) || 0;
        const intensity = max > 0 ? value / max : 0;
        const colorIndex = Math.min(
          Math.floor(intensity * (colorScale.length - 1)),
          colorScale.length - 1
        );

        allCells.push({
          x: chartPadding.left + c * (cellWidth + 2),
          y: chartPadding.top + r * (cellHeight + 2),
          width: cellWidth,
          height: cellHeight,
          value,
          color: colorScale[colorIndex],
          row: r,
          col: c,
        });
      }
    }

    return { cells: allCells, maxValue: max };
  }, [data, rows, cols, colorScale, chartWidth, chartHeight]);

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
        {/* Column labels */}
        {colLabels.map((label, i) => (
          <SvgText
            key={`col-label-${i}`}
            x={chartPadding.left + i * ((chartWidth - chartPadding.left - chartPadding.right) / cols) + ((chartWidth - chartPadding.left - chartPadding.right) / cols / 2)}
            y={15}
            fontSize={9}
            fill="#888"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}

        {/* Row labels */}
        {rowLabels.map((label, i) => (
          <SvgText
            key={`row-label-${i}`}
            x={chartPadding.left - 8}
            y={chartPadding.top + i * ((chartHeight - chartPadding.top - chartPadding.bottom) / rows) + ((chartHeight - chartPadding.top - chartPadding.bottom) / rows / 2) + 4}
            fontSize={9}
            fill="#888"
            textAnchor="end"
          >
            {label}
          </SvgText>
        ))}

        {/* Cells */}
        {cells.map((cell, i) => (
          <Rect
            key={`cell-${i}`}
            x={cell.x}
            y={cell.y}
            width={cell.width}
            height={cell.height}
            fill={cell.color}
            rx={2}
            ry={2}
          />
        ))}
      </Svg>
    </View>
  );
}
