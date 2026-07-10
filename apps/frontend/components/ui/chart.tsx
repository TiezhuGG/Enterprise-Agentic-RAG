'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
  }
>(({ children, className, config, ...props }, ref) => (
  <ChartContext.Provider value={{ config }}>
    <div
      className={cn(
        'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-grid_line]:stroke-border/60 [&_.recharts-tooltip-cursor]:stroke-border',
        className,
      )}
      ref={ref}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
    </div>
  </ChartContext.Provider>
));
ChartContainer.displayName = 'ChartContainer';

const ChartTooltip = RechartsPrimitive.Tooltip;

interface TooltipPayloadItem {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  payload?: Record<string, unknown>;
  value?: number | string;
}

interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  active?: boolean;
  hideIndicator?: boolean;
  hideLabel?: boolean;
  indicator?: 'dot' | 'line';
  label?: React.ReactNode;
  labelFormatter?: (label: React.ReactNode, payload: TooltipPayloadItem[]) => React.ReactNode;
  labelKey?: string;
  nameKey?: string;
  payload?: TooltipPayloadItem[];
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      className,
      hideIndicator = false,
      hideLabel = false,
      indicator = 'dot',
      label,
      labelFormatter,
      labelKey,
      nameKey,
      payload,
    },
    ref,
  ) => {
    const { config } = useChart();
    const payloadItems = payload ?? [];

    if (!active || payloadItems.length === 0) {
      return null;
    }

    const firstItem = payloadItems[0];
    const labelConfigKey = `${labelKey ?? firstItem.dataKey ?? firstItem.name ?? 'value'}`;
    const labelValue = config[labelConfigKey]?.label ?? label;
    const tooltipLabel =
      hideLabel || !labelValue ? null : (
        <div className="font-medium">
          {labelFormatter ? labelFormatter(labelValue, payloadItems) : labelValue}
        </div>
      );

    return (
      <div
        className={cn(
          'grid min-w-32 items-start gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl',
          className,
        )}
        ref={ref}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payloadItems.map((item) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`;
            const itemConfig = config[key];
            const color =
              item.color ??
              (typeof item.payload?.fill === 'string' ? item.payload.fill : undefined) ??
              itemConfig?.color;

            return (
              <div className="flex min-w-0 items-center gap-2" key={String(item.dataKey)}>
                {!hideIndicator ? (
                  <span
                    className={cn(
                      'shrink-0 rounded-[2px]',
                      indicator === 'dot' ? 'size-2.5' : 'h-2.5 w-1',
                    )}
                    style={{ backgroundColor: color }}
                  />
                ) : null}
                <span className="truncate text-muted-foreground">
                  {itemConfig?.label ?? item.name}
                </span>
                <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

const ChartLegend = RechartsPrimitive.Legend;

interface LegendPayloadItem {
  color?: string;
  dataKey?: string | number;
  value?: React.ReactNode;
}

interface ChartLegendContentProps extends React.ComponentProps<'div'> {
  hideIcon?: boolean;
  nameKey?: string;
  payload?: LegendPayloadItem[];
  verticalAlign?: 'top' | 'bottom' | 'middle';
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, nameKey, payload, verticalAlign = 'bottom' }, ref) => {
    const { config } = useChart();
    const payloadItems = payload ?? [];

    if (payloadItems.length === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className,
        )}
        ref={ref}
      >
        {payloadItems.map((item) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`;
          const itemConfig = config[key];

          return (
            <div className="flex items-center gap-1.5 text-xs" key={String(item.value)}>
              {!hideIcon ? (
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              ) : null}
              {itemConfig?.label ?? item.value}
            </div>
          );
        })}
      </div>
    );
  },
);
ChartLegendContent.displayName = 'ChartLegendContent';

export { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent };
