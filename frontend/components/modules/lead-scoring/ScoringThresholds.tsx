'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ScoringThresholdsProps {
  modelId: string;
  onThresholdChange: () => void;
}

export default function ScoringThresholds({ modelId, onThresholdChange }: ScoringThresholdsProps) {
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    min_score: 0,
    max_score: null as number | null,
    color: '#64748b',
    notify_on_reach: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (modelId) {
      loadThresholds();
    }
  }, [modelId]);

  const loadThresholds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/lead-scoring/models/${modelId}/thresholds`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load thresholds');

      const data = await response.json();
      setThresholds(data.data || []);
    } catch (error) {
      console.error('Error loading thresholds:', error);
      toast({
        title: 'Error',
        description: 'Failed to load thresholds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingThreshold
        ? `/api/v1/lead-scoring/thresholds/${editingThreshold.id}`
        : '/api/v1/lead-scoring/thresholds';

      const payload = {
        ...formData,
        model_id: modelId,
      };

      const response = await fetch(url, {
        method: editingThreshold ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save threshold');

      toast({
        title: 'Success',
        description: `Threshold ${editingThreshold ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      setEditingThreshold(null);
      resetForm();
      loadThresholds();
      onThresholdChange();
    } catch (error) {
      console.error('Error saving threshold:', error);
      toast({
        title: 'Error',
        description: 'Failed to save threshold',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      min_score: 0,
      max_score: null,
      color: '#64748b',
      notify_on_reach: false,
    });
  };

  const handleEdit = (threshold: any) => {
    setEditingThreshold(threshold);
    setFormData({
      name: threshold.name,
      min_score: threshold.min_score,
      max_score: threshold.max_score,
      color: threshold.color || '#64748b',
      notify_on_reach: threshold.notify_on_reach,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (thresholdId: string) => {
    if (!confirm('Are you sure you want to delete this threshold?')) return;

    try {
      const response = await fetch(`/api/v1/lead-scoring/thresholds/${thresholdId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete threshold');

      toast({
        title: 'Success',
        description: 'Threshold deleted successfully',
      });

      loadThresholds();
      onThresholdChange();
    } catch (error) {
      console.error('Error deleting threshold:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete threshold',
        variant: 'destructive',
      });
    }
  };

  if (!modelId) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Please select a scoring model first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Score Thresholds</CardTitle>
            <CardDescription>
              Define score ranges to categorize leads (e.g., Hot, Warm, Cold)
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingThreshold(null);
                resetForm();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Threshold
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingThreshold ? 'Edit Threshold' : 'Create New Threshold'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure score range and notification settings
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Threshold Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Hot Lead, MQL, SQL"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_score">Minimum Score</Label>
                      <Input
                        id="min_score"
                        type="number"
                        value={formData.min_score}
                        onChange={(e) => setFormData({ ...formData, min_score: parseInt(e.target.value) })}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_score">Maximum Score</Label>
                      <Input
                        id="max_score"
                        type="number"
                        value={formData.max_score || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          max_score: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        placeholder="Leave empty for no limit"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#64748b"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify_on_reach"
                      checked={formData.notify_on_reach}
                      onCheckedChange={(checked) => setFormData({ ...formData, notify_on_reach: checked })}
                    />
                    <Label htmlFor="notify_on_reach" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notify when contact reaches this threshold
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingThreshold ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : thresholds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No thresholds defined yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Threshold
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Score Range</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Notifications</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {thresholds.map((threshold) => (
                <TableRow key={threshold.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: threshold.color }}
                      />
                      <span className="font-medium">{threshold.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {threshold.min_score}
                    {threshold.max_score ? ` - ${threshold.max_score}` : '+'}
                  </TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: threshold.color, color: '#fff' }}>
                      {threshold.color}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {threshold.notify_on_reach ? (
                      <Badge variant="default">
                        <Bell className="mr-1 h-3 w-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(threshold)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(threshold.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
