'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Users, Target, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ScoringModels from '@/components/modules/lead-scoring/ScoringModels';
import ScoringRules from '@/components/modules/lead-scoring/ScoringRules';
import ScoreAnalytics from '@/components/modules/lead-scoring/ScoreAnalytics';
import ScoringThresholds from '@/components/modules/lead-scoring/ScoringThresholds';

export default function LeadScoringPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDefaultModel();
  }, []);

  const loadDefaultModel = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/lead-scoring/models/default', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load default model');

      const data = await response.json();
      setSelectedModel(data.data);
      
      // Load analytics for the model
      if (data.data?.id) {
        await loadAnalytics(data.data.id);
      }
    } catch (error) {
      console.error('Error loading default model:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scoring model',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (modelId: string) => {
    try {
      const response = await fetch(`/api/v1/lead-scoring/analytics?model_id=${modelId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load analytics');

      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleModelChange = (model: any) => {
    setSelectedModel(model);
    if (model?.id) {
      loadAnalytics(model.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Scoring</h1>
          <p className="text-muted-foreground">
            Automatically score and prioritize leads based on behavior and demographics
          </p>
        </div>
        <Button onClick={() => setActiveTab('models')}>
          <Settings className="mr-2 h-4 w-4" />
          Manage Models
        </Button>
      </div>

      {/* Overview Stats */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.summary?.total_contacts || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.summary?.avg_score 
                  ? Math.round(parseFloat(analytics.summary.avg_score)) 
                  : 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.summary?.max_score || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Model</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium truncate">
                {selectedModel?.name || 'No model selected'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Scoring Rules</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ScoreAnalytics 
            analytics={analytics} 
            modelId={selectedModel?.id}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <ScoringRules 
            modelId={selectedModel?.id}
            onRuleChange={() => loadAnalytics(selectedModel?.id)}
          />
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <ScoringThresholds 
            modelId={selectedModel?.id}
            onThresholdChange={() => loadAnalytics(selectedModel?.id)}
          />
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <ScoringModels 
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
