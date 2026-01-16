import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Text as SvgText, G, Line } from 'react-native-svg';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
  showValues?: boolean;
  horizontal?: boolean;
  emptyMessage?: string;
}

export function BarChart({
  data,
  height = 200,
  color = '#FF4D00',
  showLabels = true,
  showValues = true,
  horizontal = false,
  emptyMessage = 'No data available',
}: BarChartProps) {
  const chartPadding = horizontal
    ? { top: 10, right: 50, bottom: 10, left: 60 }
    : { top: 20, right: 10, bottom: 40, left: 40 };
  const chartWidth = 320;
  const chartHeight = height;

  const { bars, maxValue } = useMemo(() => {
    if (data.length === 0) {
      return { bars: [], maxValue: 0 };
    }

    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);

    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    if (horizontal) {
      const barHeight = Math.min(30, innerHeight / data.length - 8);
      const barGap = (innerHeight - barHeight * data.length) / (data.length + 1);

      return {
        bars: data.map((d, i) => ({
          x: chartPadding.left,
          y: chartPadding.top + barGap + i * (barHeight + barGap),
          width: (d.value / max) * innerWidth,
          height: barHeight,
          value: d.value,
          label: d.label,
          color: d.color || color,
        })),
        maxValue: max,
      };
    }

    const barWidth = Math.min(40, (innerWidth / data.length) * 0.7);
    const barGap = (innerWidth - barWidth * data.length) / (data.length + 1);

    return {
      bars: data.map((d, i) => ({
        x: chartPadding.left + barGap + i * (barWidth + barGap),
        y: chartPadding.top + innerHeight - (d.value / max) * innerHeight,
        width: barWidth,
        height: (d.value / max) * innerHeight,
        value: d.value,
        label: d.label,
        color: d.color || color,
      })),
      maxValue: max,
    };
  }, [data, chartWidth, chartHeight, horizontal, color]);

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
        {/* Grid lines for vertical bars */}
        {!horizontal &&
          [0, 25, 50, 75, 100].map((pct, i) => {
            const y =
              chartPadding.top +
              (chartHeight - chartPadding.top - chartPadding.bottom) * (1 - pct / 100);
            return (
              <G key={`grid-${i}`}>
                <Line
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartWidth - chartPadding.right}
                  y2={y}
                  stroke="#333"
                  strokeWidth={0.5}
                  strokeDasharray="4,4"
                />
                {showLabels && (
                  <SvgText
                    x={chartPadding.left - 8}
                    y={y + 4}
                    fontSize={10}
                    fill="#888"
                    textAnchor="end"
                  >
                    {Math.round((pct / 100) * maxValue)}
                  </SvgText>
                )}
              </G>
            );
          })}

        {/* Bars */}
        {bars.map((bar, i) => (
          <G key={`bar-${i}`}>
            <Rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color}
              rx={4}
              ry={4}
            />
            {/* Labels */}
            {showLabels && (
              <SvgText
                x={horizontal ? chartPadding.left - 8 : bar.x + bar.width / 2}
                y={horizontal ? bar.y + bar.height / 2 + 4 : chartHeight - 10}
                fontSize={10}
                fill="#888"
                textAnchor={horizontal ? 'end' : 'middle'}
              >
                {bar.label}
              </SvgText>
            )}
            {/* Values */}
            {showValues && (
              <SvgText
                x={horizontal ? bar.x + bar.width + 8 : bar.x + bar.width / 2}
                y={horizontal ? bar.y + bar.height / 2 + 4 : bar.y - 8}
                fontSize={10}
                fill="#fff"
                fontWeight="600"
                textAnchor={horizontal ? 'start' : 'middle'}
              >
                {bar.value}
              </SvgText>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
}
