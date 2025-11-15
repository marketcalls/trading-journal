'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tradesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { formatINR } from '@/lib/currency';

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
  tags: string | null;
  screenshot_path: string | null;
}

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = parseInt(params.id as string);
  const tradeId = parseInt(params.tradeId as string);

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeData, setCloseData] = useState({
    exit_price: '',
    exit_date: new Date().toISOString().split('T')[0],
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTrade();
  }, [tradeId]);

  const fetchTrade = async () => {
    try {
      const response = await tradesApi.getById(tradeId);
      setTrade(response.data);
    } catch (error) {
      console.error('Failed to fetch trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async () => {
    try {
      await tradesApi.close(tradeId, {
        exit_price: parseFloat(closeData.exit_price),
        exit_date: new Date(closeData.exit_date).toISOString(),
      });
      setShowCloseDialog(false);
      fetchTrade();
    } catch (error) {
      console.error('Failed to close trade:', error);
    }
  };

  const handleUploadScreenshot = async () => {
    if (!file) return;

    try {
      await tradesApi.uploadScreenshot(tradeId, file);
      fetchTrade();
      setFile(null);
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!trade) {
    return <div>Trade not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{trade.symbol}</h1>
          <p className="text-muted-foreground">
            {trade.trade_type.toUpperCase()} • {trade.status.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          {trade.status === 'open' && (
            <Button onClick={() => setShowCloseDialog(true)}>Close Trade</Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry Price:</span>
              <span className="font-medium">{formatINR(trade.entry_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry Date:</span>
              <span className="font-medium">{format(new Date(trade.entry_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{trade.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position Size:</span>
              <span className="font-medium">{formatINR(trade.entry_price * trade.quantity)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trade.exit_price ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exit Price:</span>
                  <span className="font-medium">{formatINR(trade.exit_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exit Date:</span>
                  <span className="font-medium">
                    {trade.exit_date && format(new Date(trade.exit_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P&L:</span>
                  <span className={`font-medium ${(trade.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatINR(trade.profit_loss || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P&L %:</span>
                  <span className={`font-medium ${(trade.profit_loss_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trade.profit_loss_percentage?.toFixed(2)}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Trade is still open</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Tags</Label>
            <p className="mt-1">{trade.tags || 'No tags'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Notes</Label>
            <p className="mt-1 whitespace-pre-wrap">{trade.notes || 'No notes'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Screenshot</CardTitle>
          <CardDescription>Upload a screenshot of your trade setup or chart</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trade.screenshot_path && (
            <div className="text-sm text-muted-foreground">
              Screenshot uploaded: {trade.screenshot_path}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button onClick={handleUploadScreenshot} disabled={!file}>
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Trade</DialogTitle>
            <DialogDescription>Enter the exit details for this trade</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exit_price">Exit Price</Label>
              <Input
                id="exit_price"
                type="number"
                step="0.01"
                value={closeData.exit_price}
                onChange={(e) => setCloseData({ ...closeData, exit_price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit_date">Exit Date</Label>
              <Input
                id="exit_date"
                type="date"
                value={closeData.exit_date}
                onChange={(e) => setCloseData({ ...closeData, exit_date: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseTrade}>Close Trade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
