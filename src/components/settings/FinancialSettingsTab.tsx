
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { fetchTransactionCategories, fetchTransactionSubcategories, fetchPaymentMethods } from '@/integrations/supabase/financial';

const FinancialSettingsTab = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para formulários
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    icon: '',
    color: '#3b82f6',
    type: 'both' as 'income' | 'expense' | 'both'
  });
  const [subcategoryForm, setSubcategoryForm] = useState({
    id: '',
    name: '',
    category_id: ''
  });
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    id: '',
    name: '',
    icon: '',
    type: 'other' as 'cash' | 'card' | 'pix' | 'transfer' | 'other'
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, subcategoriesData, paymentMethodsData] = await Promise.all([
        fetchTransactionCategories(),
        fetchTransactionSubcategories(),
        fetchPaymentMethods()
      ]);
      
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações financeiras",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (categoryForm.id) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('transaction_categories')
          .update({
            name: categoryForm.name,
            icon: categoryForm.icon,
            color: categoryForm.color,
            type: categoryForm.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', categoryForm.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria atualizada com sucesso!" });
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('transaction_categories')
          .insert({
            name: categoryForm.name,
            icon: categoryForm.icon,
            color: categoryForm.color,
            type: categoryForm.type
          });

        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria criada com sucesso!" });
      }

      setCategoryForm({ id: '', name: '', icon: '', color: '#3b82f6', type: 'both' });
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
        variant: "destructive",
      });
    }
  };

  const handleSaveSubcategory = async () => {
    try {
      if (subcategoryForm.id) {
        // Atualizar subcategoria existente
        const { error } = await supabase
          .from('transaction_subcategories')
          .update({
            name: subcategoryForm.name,
            category_id: subcategoryForm.category_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', subcategoryForm.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Subcategoria atualizada com sucesso!" });
      } else {
        // Criar nova subcategoria
        const { error } = await supabase
          .from('transaction_subcategories')
          .insert({
            name: subcategoryForm.name,
            category_id: subcategoryForm.category_id
          });

        if (error) throw error;
        toast({ title: "Sucesso", description: "Subcategoria criada com sucesso!" });
      }

      setSubcategoryForm({ id: '', name: '', category_id: '' });
      setShowSubcategoryModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar subcategoria",
        variant: "destructive",
      });
    }
  };

  const handleSavePaymentMethod = async () => {
    try {
      if (paymentMethodForm.id) {
        // Atualizar forma de pagamento existente
        const { error } = await supabase
          .from('payment_methods')
          .update({
            name: paymentMethodForm.name,
            icon: paymentMethodForm.icon,
            type: paymentMethodForm.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentMethodForm.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Forma de pagamento atualizada com sucesso!" });
      } else {
        // Criar nova forma de pagamento
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            name: paymentMethodForm.name,
            icon: paymentMethodForm.icon,
            type: paymentMethodForm.type
          });

        if (error) throw error;
        toast({ title: "Sucesso", description: "Forma de pagamento criada com sucesso!" });
      }

      setPaymentMethodForm({ id: '', name: '', icon: '', type: 'other' });
      setShowPaymentMethodModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar forma de pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar forma de pagamento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('transaction_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Categoria removida com sucesso!" });
      loadData();
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover categoria",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) return;

    try {
      const { error } = await supabase
        .from('transaction_subcategories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Subcategoria removida com sucesso!" });
      loadData();
    } catch (error) {
      console.error('Erro ao remover subcategoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover subcategoria",
        variant: "destructive",
      });
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta forma de pagamento?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Forma de pagamento removida com sucesso!" });
      loadData();
    } catch (error) {
      console.error('Erro ao remover forma de pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover forma de pagamento",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Receita';
      case 'expense': return 'Despesa';
      case 'both': return 'Ambos';
      default: return type;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'pix': return 'PIX';
      case 'transfer': return 'Transferência';
      case 'other': return 'Outros';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações Financeiras</h2>
        <p className="text-muted-foreground">
          Gerencie categorias, subcategorias e formas de pagamento
        </p>
      </div>
      
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategorias</TabsTrigger>
          <TabsTrigger value="payment-methods">Formas de Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Categorias de Transação</CardTitle>
                  <CardDescription>Gerencie as categorias de receitas e despesas</CardDescription>
                </div>
                <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setCategoryForm({ id: '', name: '', icon: '', color: '#3b82f6', type: 'both' })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{categoryForm.id ? 'Editar' : 'Nova'} Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Nome</Label>
                        <Input
                          id="categoryName"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome da categoria"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryIcon">Ícone</Label>
                        <Input
                          id="categoryIcon"
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                          placeholder="🍽️"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryColor">Cor</Label>
                        <Input
                          id="categoryColor"
                          type="color"
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <Select value={categoryForm.type} onValueChange={(value: any) => setCategoryForm(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Receita</SelectItem>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveCategory}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {category.icon && <span className="text-xl">{category.icon}</span>}
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" style={{ backgroundColor: category.color + '20', color: category.color }}>
                            {getTypeLabel(category.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCategoryForm(category);
                          setShowCategoryModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcategories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Subcategorias</CardTitle>
                  <CardDescription>Gerencie as subcategorias de transações</CardDescription>
                </div>
                <Dialog open={showSubcategoryModal} onOpenChange={setShowSubcategoryModal}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSubcategoryForm({ id: '', name: '', category_id: '' })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Subcategoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{subcategoryForm.id ? 'Editar' : 'Nova'} Subcategoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subcategoryName">Nome</Label>
                        <Input
                          id="subcategoryName"
                          value={subcategoryForm.name}
                          onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome da subcategoria"
                        />
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Select value={subcategoryForm.category_id} onValueChange={(value) => setSubcategoryForm(prev => ({ ...prev, category_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.icon && <span className="mr-2">{category.icon}</span>}
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowSubcategoryModal(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveSubcategory}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subcategories.map((subcategory) => {
                  const category = categories.find(c => c.id === subcategory.category_id);
                  return (
                    <div key={subcategory.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{subcategory.name}</h4>
                        {category && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.icon && <span className="mr-1">{category.icon}</span>}
                            {category.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSubcategoryForm(subcategory);
                            setShowSubcategoryModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Formas de Pagamento</CardTitle>
                  <CardDescription>Gerencie as formas de pagamento disponíveis</CardDescription>
                </div>
                <Dialog open={showPaymentMethodModal} onOpenChange={setShowPaymentMethodModal}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setPaymentMethodForm({ id: '', name: '', icon: '', type: 'other' })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Forma de Pagamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{paymentMethodForm.id ? 'Editar' : 'Nova'} Forma de Pagamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="paymentMethodName">Nome</Label>
                        <Input
                          id="paymentMethodName"
                          value={paymentMethodForm.name}
                          onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome da forma de pagamento"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentMethodIcon">Ícone</Label>
                        <Input
                          id="paymentMethodIcon"
                          value={paymentMethodForm.icon}
                          onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, icon: e.target.value }))}
                          placeholder="💳"
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <Select value={paymentMethodForm.type} onValueChange={(value: any) => setPaymentMethodForm(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                            <SelectItem value="card">Cartão</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="transfer">Transferência</SelectItem>
                            <SelectItem value="other">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowPaymentMethodModal(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSavePaymentMethod}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {method.icon && <span className="text-xl">{method.icon}</span>}
                      <div>
                        <h4 className="font-medium">{method.name}</h4>
                        <Badge variant="outline" className="mt-1">
                          {getPaymentTypeLabel(method.type)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPaymentMethodForm(method);
                          setShowPaymentMethodModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialSettingsTab;
