import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import "swagger-ui-react/swagger-ui.css";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Key, Webhook, BookOpen } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SwaggerDocs: React.FC = () => {
  const navigate = useNavigate();
  
  // Swagger specification in OpenAPI format
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "ConsultorPRO API",
      version: "1.0.0",
      description: "API documentation for ConsultorPRO system"
    },
    servers: [
      {
        url: "https://qffpioepvkfvpuqdbbnh.supabase.co/rest/v1",
        description: "Supabase REST API"
      },
      {
        url: "https://qffpioepvkfvpuqdbbnh.supabase.co/functions/v1",
        description: "Supabase Edge Functions"
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "apikey",
          description: "Supabase anon key - Você pode usar esta apiKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZnBpb2VwdmtmdnB1cWRiYm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzQ5NDIsImV4cCI6MjA2MzUxMDk0Mn0.ZD1AuPVDNuqTeYz8Eyt4QZHf_Qt1K-9oZcK3_fxSx-w"
        },
        authToken: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Bearer token for authenticated users"
        }
      },
      schemas: {
        DemandRequest: {
          type: "object",
          required: ["nome", "data_inicio", "data_fim", "valor_total"],
          properties: {
            nome: { 
              type: "string", 
              description: "Nome da demanda",
              example: "Desenvolvimento de Sistema Web"
            },
            descricao: { 
              type: "string", 
              description: "Descrição detalhada da demanda",
              example: "Sistema completo de gestão de projetos"
            },
            cliente_id: { 
              type: "string", 
              format: "uuid",
              description: "ID do cliente (se já existir no sistema)"
            },
            cliente_nome: { 
              type: "string", 
              description: "Nome do cliente (será criado se não existir)",
              example: "Empresa XYZ Ltda"
            },
            servico_id: { 
              type: "string", 
              format: "uuid",
              description: "ID do serviço (se já existir no sistema)"
            },
            servico_nome: { 
              type: "string", 
              description: "Nome do serviço",
              example: "Desenvolvimento Web"
            },
            data_inicio: { 
              type: "string", 
              format: "date",
              description: "Data de início no formato YYYY-MM-DD",
              example: "2024-01-15"
            },
            data_fim: { 
              type: "string", 
              format: "date",
              description: "Data de fim no formato YYYY-MM-DD",
              example: "2024-03-15"
            },
            valor_total: { 
              type: "number", 
              description: "Valor total da demanda",
              example: 15000.00
            },
            horas_totais: { 
              type: "number", 
              description: "Total de horas estimadas",
              example: 120
            },
            valor_hora: { 
              type: "number", 
              description: "Valor por hora",
              example: 125.00
            },
            observacoes: { 
              type: "string", 
              description: "Observações adicionais"
            },
            url: { 
              type: "string", 
              description: "URL relacionada ao projeto"
            },
            etapas: {
              type: "array",
              description: "Etapas do projeto",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string", example: "Análise de Requisitos" },
                  descricao: { type: "string", example: "Levantamento e documentação dos requisitos" },
                  dias: { type: "number", example: 10 },
                  horas: { type: "number", example: 40 },
                  valor: { type: "number", example: 5000.00 }
                },
                required: ["nome", "dias", "horas", "valor"]
              }
            }
          }
        },
        DemandResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                demanda_id: { type: "string", format: "uuid" },
                nome: { type: "string" },
                cliente_id: { type: "string", format: "uuid" },
                servico_id: { type: "string", format: "uuid" },
                status: { type: "string" },
                created_at: { type: "string", format: "date-time" }
              }
            },
            timestamp: { type: "string", format: "date-time" }
          }
        },
        Consultant: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            salary: { type: "number" },
            commission_percentage: { type: "number" },
            hours_per_month: { type: "integer" },
            created_at: { type: "string", format: "date-time" }
          }
        },
        ConsultantInput: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            salary: { type: "number" },
            commission_percentage: { type: "number" },
            hours_per_month: { type: "integer" }
          }
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            client_id: { type: "string", format: "uuid" },
            main_consultant_id: { type: "string", format: "uuid" },
            support_consultant_id: { type: "string", format: "uuid" },
            total_value: { type: "number" },
            created_at: { type: "string", format: "date-time" }
          }
        },
        ProjectInput: {
          type: "object",
          required: ["name", "main_consultant_id", "start_date", "end_date"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            client_id: { type: "string", format: "uuid" },
            main_consultant_id: { type: "string", format: "uuid" },
            support_consultant_id: { type: "string", format: "uuid" },
            total_value: { type: "number" },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" }
          }
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            total_hours: { type: "number" },
            hourly_rate: { type: "number" },
            total_value: { type: "number" },
            created_at: { type: "string", format: "date-time" }
          }
        },
        Client: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            contact_name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            created_at: { type: "string", format: "date-time" }
          }
        }
      }
    },
    security: [
      {
        apiKey: [],
        authToken: []
      }
    ],
    paths: {
      "/webhooks/api/demands": {
        post: {
          summary: "Criar nova demanda",
          tags: ["Demandas"],
          description: "Endpoint para criar novas demandas no sistema via API",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DemandRequest"
                },
                examples: {
                  exemplo_completo: {
                    summary: "Exemplo com todas as informações",
                    value: {
                      nome: "Desenvolvimento de E-commerce",
                      descricao: "Sistema completo de e-commerce com integração de pagamento",
                      cliente_nome: "Tech Solutions Ltda",
                      servico_nome: "Desenvolvimento Web",
                      data_inicio: "2024-02-01",
                      data_fim: "2024-05-30",
                      valor_total: 25000.00,
                      horas_totais: 200,
                      valor_hora: 125.00,
                      observacoes: "Projeto prioritário com entrega em fases",
                      url: "https://projeto.exemplo.com",
                      etapas: [
                        {
                          nome: "Análise e Planejamento",
                          descricao: "Levantamento de requisitos e arquitetura",
                          dias: 15,
                          horas: 60,
                          valor: 7500.00
                        },
                        {
                          nome: "Desenvolvimento Frontend",
                          descricao: "Interface do usuário e experiência",
                          dias: 30,
                          horas: 80,
                          valor: 10000.00
                        },
                        {
                          nome: "Desenvolvimento Backend",
                          descricao: "API e integrações",
                          dias: 25,
                          horas: 60,
                          valor: 7500.00
                        }
                      ]
                    }
                  },
                  exemplo_simples: {
                    summary: "Exemplo mínimo",
                    value: {
                      nome: "Consultoria Estratégica",
                      cliente_nome: "Startup ABC",
                      data_inicio: "2024-01-15",
                      data_fim: "2024-02-15",
                      valor_total: 8000.00
                    }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Demanda criada com sucesso",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/DemandResponse"
                  },
                  examples: {
                    sucesso: {
                      summary: "Resposta de sucesso",
                      value: {
                        success: true,
                        message: "Demanda cadastrada com sucesso",
                        data: {
                          demanda_id: "123e4567-e89b-12d3-a456-426614174000",
                          nome: "Desenvolvimento de E-commerce",
                          cliente_id: "456e7890-e89b-12d3-a456-426614174000",
                          servico_id: "789e0123-e89b-12d3-a456-426614174000",
                          status: "em_planejamento",
                          created_at: "2024-01-15T10:30:00Z"
                        },
                        timestamp: "2024-01-15T10:30:00Z"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Dados inválidos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      validationErrors: { 
                        type: "array",
                        items: { type: "string" }
                      },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Erro interno do servidor"
            }
          }
        }
      },
      "/consultants": {
        get: {
          summary: "Get all consultants",
          tags: ["Consultants"],
          responses: {
            "200": {
              description: "List of consultants",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Consultant"
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: "Create a consultant",
          tags: ["Consultants"],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ConsultantInput"
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Consultant created successfully"
            }
          }
        }
      },
      "/projects": {
        get: {
          summary: "Get all projects",
          tags: ["Projects"],
          responses: {
            "200": {
              description: "List of projects",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Project"
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: "Create a project",
          tags: ["Projects"],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ProjectInput"
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Project created successfully"
            }
          }
        }
      },
      "/services": {
        get: {
          summary: "Get all services",
          tags: ["Services"],
          responses: {
            "200": {
              description: "List of services",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Service"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/clients": {
        get: {
          summary: "Get all clients",
          tags: ["Clients"],
          responses: {
            "200": {
              description: "List of clients",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Client"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/webhook/subscribe": {
        post: {
          summary: "Subscribe to a webhook",
          tags: ["Webhooks"],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: {
                      type: "string",
                      description: "Webhook URL to receive notifications"
                    },
                    events: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: ["INSERT", "UPDATE", "DELETE"]
                      },
                      description: "Database events to subscribe to"
                    },
                    tables: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: ["consultants", "projects", "services", "clients", "tags"]
                      },
                      description: "Tables to subscribe to"
                    }
                  },
                  required: ["url"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Webhook subscription created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "Webhook subscription ID"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground">Explore the ConsultorPRO API</p>
      </div>

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertTitle>🎯 Nova API de Demandas Disponível</AlertTitle>
        <AlertDescription>
          <p className="mb-3">A API para criação de demandas está configurada e funcionando! Use o endpoint:</p>
          <code className="bg-muted px-2 py-1 rounded text-sm break-all block mb-3">
            POST https://qffpioepvkfvpuqdbbnh.supabase.co/functions/v1/webhooks/api/demands
          </code>
          <p className="text-sm text-green-600 font-medium">✅ Testado e aprovado para produção</p>
        </AlertDescription>
      </Alert>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Webhook className="h-5 w-5" />
            Tutorial: Como Configurar a API de Demandas
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Guia completo para integrar sistemas externos com a API de criação de demandas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1. Configuração Básica</h4>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border">
              <p><strong>URL do Endpoint:</strong></p>
              <code className="text-xs block mt-1">https://qffpioepvkfvpuqdbbnh.supabase.co/functions/v1/webhooks/api/demands</code>
              <p className="mt-2"><strong>Método:</strong> POST</p>
              <p><strong>Content-Type:</strong> application/json</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Headers Obrigatórios</h4>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border">
              <code className="text-xs block">apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZnBpb2VwdmtmdnB1cWRiYm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzQ5NDIsImV4cCI6MjA2MzUxMDk0Mn0.ZD1AuPVDNuqTeYz8Eyt4QZHf_Qt1K-9oZcK3_fxSx-w</code>
              <code className="text-xs block mt-1">Content-Type: application/json</code>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Exemplo de Requisição Mínima</h4>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border">
              <pre className="text-xs overflow-x-auto">
{`{
  "nome": "Desenvolvimento de Sistema",
  "cliente_nome": "Empresa ABC Ltda",
  "data_inicio": "2024-02-01",
  "data_fim": "2024-04-30",
  "valor_total": 15000.00
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Exemplo com Etapas</h4>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border">
              <pre className="text-xs overflow-x-auto">
{`{
  "nome": "E-commerce Completo",
  "descricao": "Sistema de vendas online",
  "cliente_nome": "Loja Virtual XYZ",
  "data_inicio": "2024-03-01",
  "data_fim": "2024-06-30",
  "valor_total": 30000.00,
  "horas_totais": 240,
  "valor_hora": 125.00,
  "etapas": [
    {
      "nome": "Análise de Requisitos",
      "descricao": "Levantamento e documentação",
      "dias": 10,
      "horas": 40,
      "valor": 5000.00
    },
    {
      "nome": "Desenvolvimento",
      "descricao": "Codificação do sistema",
      "dias": 45,
      "horas": 160,
      "valor": 20000.00
    },
    {
      "nome": "Testes e Deploy",
      "descricao": "Testes e publicação",
      "dias": 15,
      "horas": 40,
      "valor": 5000.00
    }
  ]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">5. Campos Obrigatórios</h4>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200">
              <ul className="text-xs space-y-1">
                <li>• <strong>nome:</strong> Nome da demanda</li>
                <li>• <strong>data_inicio:</strong> Data de início (YYYY-MM-DD)</li>
                <li>• <strong>data_fim:</strong> Data de fim (YYYY-MM-DD)</li>
                <li>• <strong>valor_total:</strong> Valor total (número)</li>
                <li>• <strong>cliente_id OU cliente_nome:</strong> Cliente existente ou novo</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">6. Resposta de Sucesso</h4>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200">
              <pre className="text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "Demanda cadastrada com sucesso",
  "data": {
    "demanda_id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "Desenvolvimento de Sistema",
    "cliente_id": "456e7890-e89b-12d3-a456-426614174000",
    "status": "em_planejamento",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">7. Funcionalidades Automáticas</h4>
            <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded border">
              <ul className="text-xs space-y-1">
                <li>• ✅ Criação automática de clientes (se não existir)</li>
                <li>• ✅ Vinculação com serviços existentes</li>
                <li>• ✅ Validação completa de dados</li>
                <li>• ✅ Criação de etapas do projeto</li>
                <li>• ✅ Status inicial: "em_planejamento"</li>
                <li>• ✅ Cálculos automáticos de valores</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Informação sobre autenticação</AlertTitle>
        <AlertDescription>
          <p>Para utilizar a API, você precisará da chave de API (apiKey):</p>
          <code className="bg-muted px-2 py-1 rounded text-sm break-all mt-1 block">
            eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZnBpb2VwdmtmdnB1cWRiYm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzQ5NDIsImV4cCI6MjA2MzUxMDk0Mn0.ZD1AuPVDNuqTeYz8Eyt4QZHf_Qt1K-9oZcK3_fxSx-w
          </code>
          <div className="flex items-center mt-3 gap-2">
            <p>Você também pode gerenciar ou criar novas API Keys:</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigate('/settings');
                // Wait for navigation and then change tab
                setTimeout(() => {
                  document.querySelector('[value="api_keys"]')?.dispatchEvent(
                    new MouseEvent('click', { bubbles: true })
                  );
                }, 100);
              }}
            >
              <Key className="h-4 w-4 mr-1" /> Gerenciar API Keys
            </Button>
          </div>
          <p className="mt-2">Para usuários autenticados, você também precisará incluir um token de autorização no formato <code className="bg-muted px-1 py-0.5 rounded text-xs">Bearer [seu-token]</code>.</p>
        </AlertDescription>
      </Alert>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Swagger Documentation</CardTitle>
          <CardDescription>
            Documentação interativa da API ConsultorPRO usando OpenAPI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SwaggerUI spec={spec} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SwaggerDocs;
