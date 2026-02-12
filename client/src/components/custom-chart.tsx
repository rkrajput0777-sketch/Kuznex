import { useEffect, useRef, useCallback } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";

interface CustomChartProps {
  symbol: string;
  displayName: string;
}

const COLORS = {
  bg: "#161A25",
  textPrimary: "#D1D4DC",
  textSecondary: "#787B86",
  gridLines: "#1E222D",
  borderColor: "#2A2E39",
  upColor: "#0ECB81",
  downColor: "#F6465D",
  upWick: "#0ECB81",
  downWick: "#F6465D",
};

export default function CustomChart({ symbol, displayName }: CustomChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livePrice = useRef<{ price: string; direction: "up" | "down" }>({ price: "0", direction: "up" });
  const priceDisplayRef = useRef<HTMLSpanElement>(null);

  const updatePriceDisplay = useCallback((price: number, prevClose: number) => {
    if (!priceDisplayRef.current) return;
    const dir = price >= prevClose ? "up" : "down";
    livePrice.current = { price: price.toFixed(2), direction: dir };
    priceDisplayRef.current.textContent = `$${price.toFixed(2)}`;
    priceDisplayRef.current.style.color = dir === "up" ? COLORS.upColor : COLORS.downColor;
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: COLORS.bg },
        textColor: COLORS.textPrimary,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: COLORS.gridLines },
        horzLines: { color: COLORS.gridLines },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#4C525E", width: 1, style: 3, labelBackgroundColor: "#2A2E39" },
        horzLine: { color: "#4C525E", width: 1, style: 3, labelBackgroundColor: "#2A2E39" },
      },
      rightPriceScale: {
        borderColor: COLORS.borderColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: COLORS.borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 6,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.upColor,
      downColor: COLORS.downColor,
      borderDownColor: COLORS.downColor,
      borderUpColor: COLORS.upColor,
      wickDownColor: COLORS.downWick,
      wickUpColor: COLORS.upWick,
    });

    seriesRef.current = candleSeries;

    const binanceSymbol = symbol.replace("/", "").toUpperCase();

    if (priceDisplayRef.current) {
      priceDisplayRef.current.textContent = "--";
      priceDisplayRef.current.style.color = COLORS.textSecondary;
    }

    let prevClose = 0;

    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&limit=1000`
        );
        if (!res.ok) throw new Error("Failed to fetch klines");
        const data = await res.json();
        const candles: CandlestickData<Time>[] = data.map((k: any[]) => ({
          time: (k[0] / 1000) as Time,
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));
        candleSeries.setData(candles);
        chart.timeScale().fitContent();

        if (candles.length > 0) {
          const last = candles[candles.length - 1];
          prevClose = last.close;
          updatePriceDisplay(last.close, candles.length > 1 ? candles[candles.length - 2].close : last.open);
        }
      } catch (err) {
        console.error("[Chart] Failed to load history:", err);
      }
    };

    fetchHistory();

    const connectWs = () => {
      const wsSymbol = binanceSymbol.toLowerCase();
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_1m`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (!msg.k) return;
          const k = msg.k;
          const candle: CandlestickData<Time> = {
            time: (k.t / 1000) as Time,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
          };
          candleSeries.update(candle);
          updatePriceDisplay(candle.close, prevClose || candle.open);
          prevClose = candle.close;
        } catch {}
      };

      ws.onclose = () => {
        reconnectTimerRef.current = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, updatePriceDisplay]);

  return (
    <div className="flex flex-col w-full h-full" style={{ background: COLORS.bg }}>
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ borderBottom: `1px solid ${COLORS.borderColor}` }}
        data-testid="chart-header"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold tracking-wide"
            style={{ color: COLORS.textPrimary }}
            data-testid="chart-pair-name"
          >
            {displayName}
          </span>
          <span
            className="flex items-center gap-1 text-[10px]"
            style={{ color: COLORS.upColor }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: COLORS.upColor }}
            />
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            ref={priceDisplayRef}
            className="text-sm font-bold tabular-nums"
            style={{ color: COLORS.upColor }}
            data-testid="chart-live-price"
          >
            --
          </span>
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: "#1E222D", color: COLORS.textSecondary }}
          >
            1m
          </span>
        </div>
      </div>
      <div
        ref={chartContainerRef}
        className="flex-1 min-h-0"
        data-testid="chart-canvas"
      />
    </div>
  );
}
