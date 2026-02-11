import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeftRight,
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowLeft,
  Wallet,
  Star,
  BarChart3,
  List,
  ChevronDown,
  X,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserWallet, SpotOrder } from "@shared/schema";
import kuznexLogo from "@assets/image_1770554564085.png";

interface PairData {
  symbol: string;
  displayName: string;
  price: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  tradable: boolean;
  base: string;
  quote: string;
}

interface TickerUpdate {
  s: string;
  c: string;
  P: string;
  h: string;
  l: string;
  v: string;
  q: string;
}

interface RecentTrade {
  price: string;
  amount: string;
  time: string;
  isBuy: boolean;
}

const TRADABLE_BASES = ["BTC", "ETH", "BNB"];

function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "0.00";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(decimals);
}

function formatPrice(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(n)) return "0.00";
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.01) return n.toFixed(6);
  return n.toFixed(8);
}

function generateRecentTrades(price: number, symbol: string): RecentTrade[] {
  const trades: RecentTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < 20; i++) {
    const variation = price * (0.9995 + Math.random() * 0.001);
    const amount = (Math.random() * 2).toFixed(symbol.includes("BTC") ? 6 : 4);
    trades.push({
      price: formatPrice(variation),
      amount,
      time: new Date(now - i * (1000 + Math.random() * 3000)).toLocaleTimeString(),
      isBuy: Math.random() > 0.45,
    });
  }
  return trades;
}

export default function SpotTrade({ pair: initialPair }: { pair: string }) {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [activePair, setActivePair] = useState(initialPair?.toUpperCase() || "BTCUSDT");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderAmount, setOrderAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);
  const [livePrices, setLivePrices] = useState<Record<string, TickerUpdate>>({});
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [mobileTab, setMobileTab] = useState<"chart" | "trade" | "pairs">("chart");
  const [showMobilePairs, setShowMobilePairs] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tvContainerRef = useRef<HTMLDivElement>(null);

  const { data: pairsData = [], isLoading: pairsLoading } = useQuery<PairData[]>({
    queryKey: ["/api/spot/pairs"],
    refetchInterval: 30000,
  });

  const { data: wallets = [] } = useQuery<UserWallet[]>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const { data: orderHistory = [] } = useQuery<SpotOrder[]>({
    queryKey: ["/api/spot/orders"],
    enabled: !!user,
  });

  const currentPairData = pairsData.find(p => p.symbol === activePair);
  const liveData = livePrices[activePair];
  const currentPrice = liveData?.c || currentPairData?.price || "0";
  const priceChange = liveData?.P || currentPairData?.priceChangePercent || "0";
  const high24h = liveData?.h || currentPairData?.highPrice || "0";
  const low24h = liveData?.l || currentPairData?.lowPrice || "0";
  const volume24h = liveData?.v || currentPairData?.volume || "0";
  const quoteVolume = liveData?.q || currentPairData?.quoteVolume || "0";

  const baseCurrency = activePair.replace("USDT", "");
  const isTradable = TRADABLE_BASES.includes(baseCurrency);

  const usdtWallet = wallets.find(w => w.currency === "USDT");
  const baseWallet = wallets.find(w => w.currency === baseCurrency);
  const usdtBalance = parseFloat(usdtWallet?.balance || "0");
  const baseBalance = parseFloat(baseWallet?.balance || "0");

  useEffect(() => {
    if (!pairsData.length) return;

    const pairSet = new Set(pairsData.map(p => p.symbol));
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const tickers = JSON.parse(event.data);
        if (Array.isArray(tickers)) {
          setLivePrices(prev => {
            const updated = { ...prev };
            for (const d of tickers) {
              if (pairSet.has(d.s)) {
                updated[d.s] = { s: d.s, c: d.c, P: d.P, h: d.h, l: d.l, v: d.v, q: d.q };
              }
            }
            return updated;
          });
        }
      } catch {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [pairsData.length]);

  useEffect(() => {
    const price = parseFloat(currentPrice);
    if (price > 0) {
      setRecentTrades(generateRecentTrades(price, activePair));
    }
  }, [activePair, currentPrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      const price = parseFloat(currentPrice);
      if (price > 0) {
        setRecentTrades(prev => {
          const newTrade: RecentTrade = {
            price: formatPrice(price * (0.9998 + Math.random() * 0.0004)),
            amount: (Math.random() * 2).toFixed(activePair.includes("BTC") ? 6 : 4),
            time: new Date().toLocaleTimeString(),
            isBuy: Math.random() > 0.45,
          };
          return [newTrade, ...prev.slice(0, 19)];
        });
      }
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [activePair, currentPrice]);

  useEffect(() => {
    if (!tvContainerRef.current) return;
    tvContainerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${activePair}`,
      interval: "15",
      timezone: "Asia/Kolkata",
      theme: "light",
      style: "1",
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      hide_top_toolbar: true,
      hide_legend: true,
      save_image: false,
      allow_symbol_change: false,
      container_id: "tradingview_chart",
      backgroundColor: "rgba(255, 255, 255, 1)",
      gridColor: "rgba(240, 243, 250, 0.06)",
      height: "100%",
      width: "100%",
    });

    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    container.id = "tradingview_chart";
    container.style.height = "100%";
    container.style.width = "100%";

    tvContainerRef.current.appendChild(container);
    tvContainerRef.current.appendChild(script);
  }, [activePair]);

  const orderMutation = useMutation({
    mutationFn: async (data: { pair: string; side: string; amount: string }) => {
      const res = await apiRequest("POST", "/api/spot/order", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${orderSide} Order Filled`,
        description: `${orderSide === "BUY" ? "Bought" : "Sold"} ${data.amount} ${baseCurrency} at $${formatPrice(data.price)}`,
      });
      setOrderAmount("");
      setSliderValue([0]);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spot/orders"] });
    },
    onError: (error: Error) => {
      toast({ title: "Trade Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSliderChange = useCallback((value: number[]) => {
    setSliderValue(value);
    const pct = value[0] / 100;
    const price = parseFloat(currentPrice);
    if (price <= 0) return;

    if (orderSide === "BUY") {
      const maxAmount = usdtBalance / (price * 1.001);
      setOrderAmount(maxAmount > 0 ? (maxAmount * pct).toFixed(8) : "");
    } else {
      setOrderAmount(baseBalance > 0 ? (baseBalance * pct).toFixed(8) : "");
    }
  }, [orderSide, usdtBalance, baseBalance, currentPrice]);

  const handleOrder = () => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    orderMutation.mutate({ pair: activePair, side: orderSide, amount: orderAmount });
  };

  const handlePairChange = (symbol: string) => {
    setActivePair(symbol);
    navigate(`/trade/${symbol}`);
  };

  const fee = parseFloat(orderAmount || "0") * parseFloat(currentPrice) * 0.001;
  const totalCost = orderSide === "BUY"
    ? parseFloat(orderAmount || "0") * parseFloat(currentPrice) + fee
    : parseFloat(orderAmount || "0") * parseFloat(currentPrice) - fee;

  const filteredPairs = pairsData.filter(p =>
    p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const pairListContent = (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search pairs..."
            className="pl-8 h-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-pairs"
          />
        </div>
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-muted-foreground border-b border-border">
        <span className="flex-1">Pair</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-14 text-right">Change</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {pairsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          filteredPairs.map((pair) => {
            const lp = livePrices[pair.symbol];
            const price = lp?.c || pair.price;
            const change = lp?.P || pair.priceChangePercent;
            const isActive = pair.symbol === activePair;
            const isPositive = parseFloat(change) >= 0;
            return (
              <button
                key={pair.symbol}
                className={`w-full flex items-center gap-1 px-2 py-1.5 text-xs hover-elevate cursor-pointer ${isActive ? "bg-primary/10" : ""}`}
                onClick={() => { handlePairChange(pair.symbol); setShowMobilePairs(false); setMobileTab("chart"); }}
                data-testid={`button-pair-${pair.symbol}`}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium flex items-center gap-1">
                    {pair.displayName}
                    {pair.tradable && <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />}
                  </div>
                </div>
                <span className="w-20 text-right font-mono text-[11px]">{formatPrice(price)}</span>
                <span className={`w-14 text-right font-mono text-[11px] ${isPositive ? "text-green-600" : "text-red-500"}`}>
                  {isPositive ? "+" : ""}{parseFloat(change).toFixed(2)}%
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const chartContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background" data-testid="chart-header-kuznex">
        <span className="text-sm font-bold text-primary tracking-wide hidden sm:inline">Kuznex Pro Chart</span>
        <span className="text-muted-foreground text-xs hidden sm:inline">|</span>
        <span className="text-sm font-semibold text-foreground">{activePair.replace("USDT", "/USDT")}</span>
        <span className="text-muted-foreground text-xs">|</span>
        <span className="flex items-center gap-1 text-xs text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      </div>
      <div className="flex-1 min-h-0 relative">
        <div
          ref={tvContainerRef}
          className="tradingview-widget-container w-full h-full"
          data-testid="chart-tradingview"
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-50 flex items-center bg-background"
          style={{ height: "32px", paddingLeft: "8px" }}
          data-testid="overlay-kuznex-chart-brand"
        >
          <img src={kuznexLogo} alt="Kuznex" className="h-5 w-auto" />
          <span className="text-[10px] text-muted-foreground ml-2">Kuznex Pro Chart</span>
        </div>
      </div>
      <div className="h-48 border-t border-border overflow-hidden flex flex-col">
        <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Recent Trades</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 text-[10px] font-medium text-muted-foreground">
          <span className="flex-1">Price (USDT)</span>
          <span className="w-24 text-right">Amount ({baseCurrency})</span>
          <span className="w-20 text-right">Time</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {recentTrades.map((trade, i) => (
            <div key={i} className="flex items-center gap-1 px-3 py-0.5 text-[11px] font-mono">
              <span className={`flex-1 ${trade.isBuy ? "text-green-600" : "text-red-500"}`}>
                {trade.price}
              </span>
              <span className="w-24 text-right text-foreground">{trade.amount}</span>
              <span className="w-20 text-right text-muted-foreground">{trade.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const orderContent = (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-border">
        <div className="text-center mb-2">
          <span className="text-2xl font-bold font-mono" data-testid="text-current-price">
            ${formatPrice(currentPrice)}
          </span>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-3">
        <Tabs value={orderSide} onValueChange={(v) => { setOrderSide(v as "BUY" | "SELL"); setOrderAmount(""); setSliderValue([0]); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="BUY" className="data-[state=active]:bg-green-600 data-[state=active]:text-white" data-testid="tab-buy">
              Buy
            </TabsTrigger>
            <TabsTrigger value="SELL" className="data-[state=active]:bg-red-500 data-[state=active]:text-white" data-testid="tab-sell">
              Sell
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {!isTradable && (
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground text-center">
            This pair is view-only. Trading is available for BTC/USDT, ETH/USDT, and BNB/USDT.
          </div>
        )}

        {isTradable && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available</span>
                <span className="font-mono" data-testid="text-available-balance">
                  {orderSide === "BUY"
                    ? `${usdtBalance.toFixed(2)} USDT`
                    : `${baseBalance.toFixed(8)} ${baseCurrency}`
                  }
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Price</label>
              <Input
                value={`${formatPrice(currentPrice)} USDT`}
                disabled
                className="font-mono text-sm bg-muted"
                data-testid="input-order-price"
              />
              <span className="text-[10px] text-muted-foreground">Market Price</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Amount ({baseCurrency})</label>
              <Input
                type="number"
                placeholder={`0.00 ${baseCurrency}`}
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                className="font-mono text-sm"
                data-testid="input-order-amount"
              />
            </div>

            <div className="px-1">
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                data-testid="slider-amount-percent"
              />
              <div className="flex justify-between mt-1.5 gap-1">
                {[25, 50, 75, 100].map(pct => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-6 px-2"
                    onClick={() => handleSliderChange([pct])}
                    data-testid={`button-pct-${pct}`}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground gap-2">
                <span>Trading Fee (0.1%)</span>
                <span className="font-mono" data-testid="text-trading-fee">${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium gap-2">
                <span>{orderSide === "BUY" ? "Total Cost" : "You Receive"}</span>
                <span className="font-mono" data-testid="text-total-cost">
                  ${totalCost > 0 ? totalCost.toFixed(2) : "0.00"} USDT
                </span>
              </div>
            </div>

            <Button
              className={`w-full ${orderSide === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"} text-white`}
              onClick={handleOrder}
              disabled={orderMutation.isPending || !orderAmount}
              data-testid="button-submit-order"
            >
              {orderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : orderSide === "BUY" ? (
                <TrendingUp className="w-4 h-4 mr-2" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-2" />
              )}
              {orderSide === "BUY" ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
            </Button>
          </>
        )}

        <div className="border-t border-border pt-3">
          <h3 className="text-xs font-semibold mb-2 text-foreground">My Assets</h3>
          <div className="space-y-1.5">
            {wallets.filter(w => parseFloat(w.balance) > 0 || w.currency === "USDT").slice(0, 5).map(w => (
              <div key={w.currency} className="flex justify-between text-xs gap-2">
                <span className="text-muted-foreground">{w.currency}</span>
                <span className="font-mono" data-testid={`text-asset-${w.currency}`}>{parseFloat(w.balance).toFixed(w.currency === "USDT" || w.currency === "INR" ? 2 : 8)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-xs font-semibold mb-2 text-foreground">Order History</h3>
          {orderHistory.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-2">No orders yet</div>
          ) : (
            orderHistory.slice(0, 10).map(order => (
              <div key={order.id} className="flex items-center justify-between py-1.5 text-[11px] border-b border-border/50" data-testid={`row-order-${order.id}`}>
                <div>
                  <span className={`font-medium ${order.side === "BUY" ? "text-green-600" : "text-red-500"}`}>
                    {order.side}
                  </span>
                  <span className="ml-1 text-muted-foreground">{order.pair.replace("USDT", "/USDT")}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono">{parseFloat(order.amount).toFixed(6)} @ ${formatPrice(order.price)}</div>
                  <div className="text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="page-spot-trade">
      <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <button
            className="flex items-center gap-1.5 lg:pointer-events-none"
            onClick={() => { setShowMobilePairs(!showMobilePairs); setMobileTab("pairs"); }}
            data-testid="button-mobile-pair-selector"
          >
            <h1 className="text-base sm:text-lg font-bold whitespace-nowrap" data-testid="text-active-pair">{activePair.replace("USDT", "/USDT")}</h1>
            <ChevronDown className="w-4 h-4 text-muted-foreground lg:hidden" />
          </button>
          <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${parseFloat(priceChange) >= 0 ? "text-green-600" : "text-red-500"}`} data-testid="text-price-change">
            {parseFloat(priceChange) >= 0 ? "+" : ""}{parseFloat(priceChange).toFixed(2)}%
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div>
            <span className="mr-1">24h High:</span>
            <span className="font-medium text-foreground" data-testid="text-24h-high">{formatPrice(high24h)}</span>
          </div>
          <div>
            <span className="mr-1">24h Low:</span>
            <span className="font-medium text-foreground" data-testid="text-24h-low">{formatPrice(low24h)}</span>
          </div>
          <div>
            <span className="mr-1">24h Vol:</span>
            <span className="font-medium text-foreground" data-testid="text-24h-volume">{formatNumber(quoteVolume)} USDT</span>
          </div>
        </div>
      </header>

      <div className="sm:hidden flex items-center justify-between gap-3 px-3 py-1.5 border-b border-border text-[10px] text-muted-foreground overflow-x-auto">
        <span>H: <span className="text-foreground font-medium">{formatPrice(high24h)}</span></span>
        <span>L: <span className="text-foreground font-medium">{formatPrice(low24h)}</span></span>
        <span>Vol: <span className="text-foreground font-medium">{formatNumber(quoteVolume)}</span></span>
        <span className="font-medium text-foreground">${formatPrice(currentPrice)}</span>
      </div>

      <div className="lg:hidden flex items-center border-b border-border bg-background">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${mobileTab === "chart" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => { setMobileTab("chart"); setShowMobilePairs(false); }}
          data-testid="tab-mobile-chart"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Chart
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${mobileTab === "trade" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => { setMobileTab("trade"); setShowMobilePairs(false); }}
          data-testid="tab-mobile-trade"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Trade
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${mobileTab === "pairs" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => { setMobileTab("pairs"); setShowMobilePairs(true); }}
          data-testid="tab-mobile-pairs"
        >
          <List className="w-3.5 h-3.5" />
          Pairs
        </button>
      </div>

      <div className="flex-1 overflow-hidden lg:hidden">
        {mobileTab === "chart" && chartContent}
        {mobileTab === "trade" && orderContent}
        {mobileTab === "pairs" && pairListContent}
      </div>

      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-border flex flex-col bg-background overflow-hidden">
          {pairListContent}
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {chartContent}
        </div>
        <div className="w-80 border-l border-border flex flex-col bg-background overflow-hidden">
          {orderContent}
        </div>
      </div>
    </div>
  );
}
