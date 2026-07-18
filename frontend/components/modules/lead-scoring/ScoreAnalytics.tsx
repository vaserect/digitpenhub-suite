'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ScoreAnalyticsProps {
  analytics: any;
  modelId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ScoreAnalytics({ analytics, modelId }: ScoreAnalyticsProps) {
  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No analytics data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare score distribution data
  const scoreDistributionData = analytics.score_distribution?.map((item: any) => ({
    range: item.score_range,
    count: parseInt(item.count),
  })) || [];

  // Prepare threshold distribution data
  const thresholdDistributionData = analytics.threshold_distribution?.map((item: any) => ({
    name: item.name,
    value: parseInt(item.count),
    color: item.color,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Score Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>
            Distribution of lead scores across all contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scoreDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Number of Contacts" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No score distribution data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Threshold Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Threshold Distribution</CardTitle>
          <CardDescription>
            Breakdown of contacts by scoring thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thresholdDistributionData.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={thresholdDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {thresholdDistributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                <h4 className="font-semibold">Threshold Breakdown</h4>
                {thresholdDistributionData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-2xl font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No threshold distribution data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>
            Key metrics for your lead scoring model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Contacts</p>
              <p className="text-2xl font-bold">{analytics.summary?.total_contacts || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">
                {analytics.summary?.avg_score 
                  ? Math.round(parseFloat(analytics.summary.avg_score)) 
                  : 0}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Highest Score</p>
              <p className="text-2xl font-bold">{analytics.summary?.max_score || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Lowest Score</p>
              <p className="text-2xl font-bold">{analytics.summary?.min_score || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
