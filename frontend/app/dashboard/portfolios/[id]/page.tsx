'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { portfoliosApi, tradesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  initial_balance: number;
}

interface Trade {
  id: number;
  symbol: string;
  trade_type: string;
  status: string;
  entry_price: number;
  entry_date: string;
  exit_price: number | null;
  exit_date: string | null;
  quantity: number;
  profit_loss: number | null;
  profit_loss_percentage: number | null;
  notes: string | null;
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = parseInt(params.id as string);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
    fetchTrades();
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    try {
      const response = await portfoliosApi.getById(portfolioId);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await tradesApi.getByPortfolio(portfolioId);
      setTrades(response.data);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');

  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0).length;
  const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) <= 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{portfolio?.name}</h1>
          <p className="text-muted-foreground">{portfolio?.description || 'No description'}</p>
        </div>
        <Link href={`/dashboard/portfolios/${portfolioId}/trades/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Trade
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initial Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolio?.initial_balance.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {totalPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalPL.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {winningTrades}W / {losingTrades}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trades.length}</div>
            <p className="text-xs text-muted-foreground">
              {openTrades.length} open, {closedTrades.length} closed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Trades ({trades.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openTrades.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedTrades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <TradesTable trades={trades} portfolioId={portfolioId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle>Open Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <TradesTable trades={openTrades} portfolioId={portfolioId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed">
          <Card>
            <CardHeader>
              <CardTitle>Closed Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <TradesTable trades={closedTrades} portfolioId={portfolioId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradesTable({ trades, portfolioId }: { trades: Trade[]; portfolioId: number }) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trades found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Entry</TableHead>
          <TableHead>Exit</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>P&L</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell className="font-medium">{trade.symbol}</TableCell>
            <TableCell>
              <span className={`capitalize ${trade.trade_type === 'long' ? 'text-green-600' : 'text-red-600'}`}>
                {trade.trade_type}
              </span>
            </TableCell>
            <TableCell>
              ${trade.entry_price.toFixed(2)}
              <br />
              <span className="text-xs text-muted-foreground">
                {format(new Date(trade.entry_date), 'MMM d, yyyy')}
              </span>
            </TableCell>
            <TableCell>
              {trade.exit_price ? (
                <>
                  ${trade.exit_price.toFixed(2)}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(trade.exit_date!), 'MMM d, yyyy')}
                  </span>
                </>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>{trade.quantity}</TableCell>
            <TableCell>
              {trade.profit_loss !== null ? (
                <span className={trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${trade.profit_loss.toFixed(2)}
                  <br />
                  <span className="text-xs">
                    ({trade.profit_loss_percentage?.toFixed(2)}%)
                  </span>
                </span>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  trade.status === 'open'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {trade.status}
              </span>
            </TableCell>
            <TableCell>
              <Link href={`/dashboard/portfolios/${portfolioId}/trades/${trade.id}`}>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
