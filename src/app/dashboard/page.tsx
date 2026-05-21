'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  Clock,
  Wrench,
  Percent
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/shared/loading'
import { PageHeader } from '@/components/shared/page-header'

function StatCard({ title, value, icon: Icon, description, trend }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && <span className={trend > 0 ? 'text-emerald-600' : 'text-destructive'}>
              {trend > 0 ? '+' : ''}{trend}% 
            </span>} {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoading />
  if (!data) return <div className="p-6 text-destructive">Failed to load dashboard data</div>

  const { stats, dailySales, monthlySales, topProducts } = data

  return (
    <div className="flex h-full flex-col space-y-6 p-6 overflow-auto">
      <PageHeader 
        title="Store Dashboard" 
        description="Overview of your store's performance and key metrics." 
      />

      {/* KPI Grid 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toFixed(2)}`}
          icon={IndianRupee}
          description="Total billed today"
        />
        <StatCard
          title="Total Revenue (All Time)"
          value={`₹${stats.totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          description="Gross sales volume"
        />
        <StatCard
          title="Total Profit"
          value={`₹${stats.totalProfit.toFixed(2)}`}
          icon={Percent}
          description="Net profit generated"
        />
        <StatCard
          title="Pending Recovery"
          value={`₹${stats.pendingRecovery.toFixed(2)}`}
          icon={Clock}
          description="Action required"
          trend={-2.4} // Mock trend
        />
      </div>

      {/* KPI Grid 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions}
          icon={ShoppingCart}
          description="Invoices created"
        />
        <StatCard
          title="Products Sold"
          value={stats.totalProductsSold}
          icon={Package}
          description="Items dispatched"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="Registered profiles"
        />
        <StatCard
          title="Total Labour Cost"
          value={`₹${stats.totalLabourCost.toFixed(2)}`}
          icon={Wrench}
          description="Surcharges collected"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Daily Sales Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {dailySales.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={12}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#f97316" // Orange primary
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                Not enough data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-6">
                {topProducts.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-lg text-muted-foreground w-4">{i + 1}</div>
                      <div>
                        <div className="font-medium truncate max-w-[200px]">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.sku}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{p._count.sales} sold</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No sales data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Bar Chart */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Monthly Revenue & Profit (Year)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {monthlySales.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={12}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`₹${value.toFixed(2)}`, name === 'revenue' ? 'Revenue' : 'Profit']}
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                Not enough data for this period
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
