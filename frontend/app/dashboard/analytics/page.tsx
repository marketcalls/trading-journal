'use client';

import { useEffect, useState } from 'react';
import { portfoliosApi, analyticsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Portfolio {
  id: number;
  name: string;
}

interface Analytics {
  portfolio_id: number;
  portfolio_name: string;
  total_trades: number;
  total_profit_loss: number;
  win_rate: number;
  average_profit_loss: number;
  total_wins: number;
  total_losses: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
}

interface SymbolStat {
  symbol: string;
  total_trades: number;
  total_profit_loss: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export default function AnalyticsPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [symbolStats, setSymbolStats] = useState<SymbolStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchAnalytics(selectedPortfolio);
      fetchSymbolStats(selectedPortfolio);
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      const response = await portfoliosApi.getAll();
      const portfolioData = response.data;
      setPortfolios(portfolioData);
      if (portfolioData.length > 0) {
        setSelectedPortfolio(portfolioData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (portfolioId: number) => {
    try {
      const response = await analyticsApi.getPortfolioAnalytics(portfolioId);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchSymbolStats = async (portfolioId: number) => {
    try {
      const response = await analyticsApi.getBySymbol(portfolioId);
      setSymbolStats(response.data.symbols);
    } catch (error) {
      console.error('Failed to fetch symbol stats:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (portfolios.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-muted-foreground">No portfolios found. Create a portfolio to see analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winLossData = analytics
    ? [
        { name: 'Wins', value: analytics.total_wins, color: '#10b981' },
        { name: 'Losses', value: analytics.total_losses, color: '#ef4444' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        <select
          value={selectedPortfolio || ''}
          onChange={(e) => setSelectedPortfolio(parseInt(e.target.value))}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {portfolios.map((portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </option>
          ))}
        </select>
      </div>

      {analytics && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${analytics.total_profit_loss.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.win_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_wins}W / {analytics.total_losses}L
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.average_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${analytics.average_profit_loss.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.profit_factor.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.profit_factor >= 1 ? 'Profitable' : 'Unprofitable'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Win/Loss Distribution</CardTitle>
                <CardDescription>Overview of winning and losing trades</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed win/loss statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Trades:</span>
                  <span className="font-semibold">{analytics.total_trades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average Win:</span>
                  <span className="font-semibold text-green-600">${analytics.average_win.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average Loss:</span>
                  <span className="font-semibold text-red-600">${analytics.average_loss.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Risk/Reward Ratio:</span>
                  <span className="font-semibold">
                    {analytics.average_loss !== 0
                      ? (Math.abs(analytics.average_win / analytics.average_loss)).toFixed(2)
                      : 'N/A'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {symbolStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Symbol</CardTitle>
                <CardDescription>P&L breakdown by trading symbol</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={symbolStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_profit_loss" fill="#3b82f6" name="P&L" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
