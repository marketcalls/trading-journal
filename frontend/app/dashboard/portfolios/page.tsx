'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portfoliosApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, TrendingUp, TrendingDown } from 'lucide-react';
import { formatINR } from '@/lib/currency';

interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  initial_balance: number;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await portfoliosApi.getAll();
      setPortfolios(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading portfolios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolios</h1>
          <p className="text-muted-foreground">Manage your trading portfolios</p>
        </div>
        <Link href="/dashboard/portfolios/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Portfolio
          </Button>
        </Link>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Portfolios Yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Get started by creating your first trading portfolio. Track your trades, analyze performance, and improve your trading strategy.
            </p>
            <Link href="/dashboard/portfolios/new">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Portfolio
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Link key={portfolio.id} href={`/dashboard/portfolios/${portfolio.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FolderKanban className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{portfolio.name}</CardTitle>
                  <CardDescription>
                    {portfolio.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Initial Capital</span>
                      <span className="text-sm font-medium">{formatINR(portfolio.initial_balance)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {portfolios.length > 0 && (
        <div className="flex justify-center pt-4">
          <Link href="/dashboard/portfolios/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Portfolio
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
