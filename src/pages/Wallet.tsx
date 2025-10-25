import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, ExternalLink, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Wallet() {
  const transactions = [
    {
      id: '1',
      date: '2025-10-20 14:32',
      description: 'Payment received for "Brand Redesign for DeFi Platform"',
      client_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1',
      client_username: 'happy_client',
      amount: 1500,
      currency: 'STX',
      type: 'income',
    },
    {
      id: '2',
      date: '2025-10-20 09:15',
      description: 'Scout commission for connecting @happy_client with @sarah_designs',
      client_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1',
      talent_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      amount: 180,
      currency: 'sBTC',
      type: 'income',
    },
    {
      id: '3',
      date: '2025-10-19 16:47',
      description: 'Application credits purchased',
      amount: 10,
      currency: 'STX',
      type: 'expense',
    },
    {
      id: '4',
      date: '2025-10-18 11:23',
      description: 'Withdrawal to Stacks wallet',
      amount: 2000,
      currency: 'STX',
      type: 'expense',
    },
    {
      id: '5',
      date: '2025-10-17 13:55',
      description: 'Payment received for "Logo Design Package"',
      client_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2',
      client_username: 'startup_founder',
      amount: 850,
      currency: 'USDh',
      type: 'income',
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div>
          <h1 className="text-4xl font-black mb-2">Wallet / Earnings</h1>
          <p className="text-muted-foreground mb-8">
            Your financial hub with complete transparency
          </p>
        </div>

        {/* Financial Snapshot */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Available Balance */}
          <Card className="md:col-span-2 shadow-elevated border-l-4 border-l-success">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-5xl font-black text-success">$4,850</p>
              <Button className="w-full bg-action hover:bg-action/90" size="lg">
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>

          {/* Pending in Escrow */}
          <Card className="shadow-soft hover:shadow-elevated transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending in Escrow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">$3,000</p>
              <p className="text-xs text-muted-foreground mt-2">2 active projects</p>
            </CardContent>
          </Card>

          {/* Earnings (Last 30 Days) */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Earnings (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black">$8,420</p>
              </div>
              <div className="flex items-center text-success text-sm mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+12% vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Transaction History</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-9 w-[250px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-lg font-semibold text-sm">
                <div className="col-span-2">Date</div>
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-right">Currency</div>
                <div className="col-span-1 text-right">Tx</div>
              </div>

              {/* Transaction Rows */}
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 rounded-lg hover:bg-muted/30 transition-colors items-center border-b last:border-0"
                >
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {tx.date}
                  </div>
                  
                  <div className="col-span-5 flex items-center gap-2">
                    {tx.client_avatar && (
                      <div className="flex -space-x-2">
                        {tx.client_avatar && (
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={tx.client_avatar} />
                            <AvatarFallback>C</AvatarFallback>
                          </Avatar>
                        )}
                        {tx.talent_avatar && (
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={tx.talent_avatar} />
                            <AvatarFallback>T</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <span className="text-sm">{tx.description}</span>
                  </div>
                  
                  <div className="col-span-2 text-right">
                    <span
                      className={`text-lg font-bold ${
                        tx.type === 'income' ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}${tx.amount}
                    </span>
                  </div>
                  
                  <div className="col-span-2 text-right">
                    <Badge variant="outline">{tx.currency}</Badge>
                  </div>
                  
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="View on blockchain"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AppLayout>
  );
}
