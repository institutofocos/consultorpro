
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/dashboard/Dashboard';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Users, Briefcase, Settings, ArrowRight, Shield, Clock, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the dashboard
  if (user) {
    return <Dashboard />;
  }

  // If not authenticated, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Consultor<span className="text-blue-600">PRO</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button>Entrar</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Sistema de Gestão
            <br />
            <span className="text-blue-600">para Consultores</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Gerencie seus projetos, clientes, consultores e finanças em uma única plataforma. 
            Simplifique seu negócio e aumente sua produtividade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Uma solução completa para gerenciar todos os aspectos do seu negócio de consultoria
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center">
            <CardHeader>
              <BarChart2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Dashboard Intuitivo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize todos os seus indicadores importantes em um painel centralizado
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Briefcase className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Gestão de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize seus projetos, etapas e acompanhe o progresso em tempo real
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Controle de Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gerencie consultores, clientes e suas respectivas informações
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Controle Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acompanhe receitas, despesas e tenha controle total das finanças
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Por que escolher o ConsultorPRO?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Seguro e Confiável</h3>
                    <p className="text-gray-600">
                      Seus dados são protegidos com as melhores práticas de segurança
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Economize Tempo</h3>
                    <p className="text-gray-600">
                      Automatize processos e foque no que realmente importa
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <TrendingUp className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Aumente sua Produtividade</h3>
                    <p className="text-gray-600">
                      Tenha todas as informações na palma da mão
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:text-center">
              <Card className="inline-block">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Pronto para começar?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Faça login ou crie sua conta gratuita
                    </p>
                    <Link to="/login">
                      <Button size="lg" className="w-full">
                        Acessar Sistema
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 ConsultorPRO. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
