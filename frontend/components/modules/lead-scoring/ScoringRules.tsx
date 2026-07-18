'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ScoringRulesProps {
  modelId: string;
  onRuleChange: () => void;
}

const RULE_TYPES = [
  { value: 'property', label: 'Property' },
  { value: 'activity', label: 'Activity' },
  { value: 'demographic', label: 'Demographic' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'engagement', label: 'Engagement' },
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
];

export default function ScoringRules({ modelId, onRuleChange }: ScoringRulesProps) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'property',
    score_change: 0,
    is_active: true,
    priority: 0,
    conditions: [{ field: '', operator: 'equals', value: '' }],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (modelId) {
      loadRules();
    }
  }, [modelId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/lead-scoring/models/${modelId}/rules`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load rules');

      const data = await response.json();
      setRules(data.data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scoring rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingRule
        ? `/api/v1/lead-scoring/rules/${editingRule.id}`
        : '/api/v1/lead-scoring/rules';

      const payload = {
        ...formData,
        model_id: modelId,
      };

      const response = await fetch(url, {
        method: editingRule ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save rule');

      toast({
        title: 'Success',
        description: `Rule ${editingRule ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      setEditingRule(null);
      resetForm();
      loadRules();
      onRuleChange();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rule',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'property',
      score_change: 0,
      is_active: true,
      priority: 0,
      conditions: [{ field: '', operator: 'equals', value: '' }],
    });
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      score_change: rule.score_change,
      is_active: rule.is_active,
      priority: rule.priority,
      conditions: rule.conditions || [{ field: '', operator: 'equals', value: '' }],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/v1/lead-scoring/rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete rule');

      toast({
        title: 'Success',
        description: 'Rule deleted successfully',
      });

      loadRules();
      onRuleChange();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rule',
        variant: 'destructive',
      });
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: '', operator: 'equals', value: '' }],
    });
  };

  const removeCondition = (index: number) => {
    const newConditions = formData.conditions.filter((_, i) => i !== index);
    setFormData({ ...formData, conditions: newConditions });
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const getRuleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      property: 'bg-blue-100 text-blue-800',
      activity: 'bg-green-100 text-green-800',
      demographic: 'bg-purple-100 text-purple-800',
      behavioral: 'bg-orange-100 text-orange-800',
      engagement: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
            <CardTitle>Scoring Rules</CardTitle>
            <CardDescription>
              Define rules that automatically score leads based on their properties and behavior
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRule(null);
                resetForm();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Rule' : 'Create New Rule'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure conditions and score changes for this rule
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Rule Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Email Opened"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rule_type">Rule Type</Label>
                      <Select
                        value={formData.rule_type}
                        onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RULE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe when this rule should apply"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="score_change">Score Change</Label>
                      <Input
                        id="score_change"
                        type="number"
                        value={formData.score_change}
                        onChange={(e) => setFormData({ ...formData, score_change: parseInt(e.target.value) })}
                        placeholder="e.g., 10 or -5"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Positive to add points, negative to subtract
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower numbers execute first
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Conditions</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Condition
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All conditions must be met for the rule to apply
                    </p>

                    <div className="space-y-2">
                      {formData.conditions.map((condition, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Field name (e.g., email, company_size)"
                              value={condition.field}
                              onChange={(e) => updateCondition(index, 'field', e.target.value)}
                              required
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={condition.operator}
                                onValueChange={(value) => updateCondition(index, 'operator', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {OPERATORS.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Value"
                                value={condition.value}
                                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                required={!['is_empty', 'is_not_empty'].includes(condition.operator)}
                              />
                            </div>
                          </div>
                          {formData.conditions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCondition(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRule ? 'Update' : 'Create'}
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
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No scoring rules yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Rule
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {rule.conditions?.length || 0} condition(s)
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRuleTypeColor(rule.rule_type)}>
                      {rule.rule_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={rule.score_change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {rule.score_change > 0 ? '+' : ''}{rule.score_change}
                    </span>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
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
