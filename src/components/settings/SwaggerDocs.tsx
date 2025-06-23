
import React, { useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import "swagger-ui-react/swagger-ui.css";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Key, Webhook, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SwaggerDocs: React.FC = () => {
  const navigate = useNavigate();
  const [isMainUpdatesOpen, setIsMainUpdatesOpen] = useState(false);
  const [isSwaggerDocsOpen, setIsSwaggerDocsOpen] = useState(false);
  
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
        ServiceInput: {
          type: "object",
          required: ["name", "total_hours"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            total_hours: { type: "number" },
            hourly_rate: { type: "number" },
            total_value: { type: "number" },
            tax_rate: { type: "number" },
            extra_costs: { type: "number" },
            url: { type: "string" }
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
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip_code: { type: "string" },
            notes: { type: "string" },
            created_at: { type: "string", format: "date-time" }
          }
        },
        ClientInput: {
          type: "object",
          required: ["name", "contact_name"],
          properties: {
            name: { type: "string" },
            contact_name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip_code: { type: "string" },
            notes: { type: "string" }
          }
        },
        ConflictError: {
          type: "object",
          properties: {
            error: { type: "string", example: "Registro já existe" },
            code: { type: "integer", example: 409 },
            message: { type: "string", example: "Um registro com essas informações já foi cadastrado no sistema" },
            existing_id: { type: "string", format: "uuid", description: "ID do registro existente" },
            timestamp: { type: "string", format: "date-time" }
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
      "/demands": {
        post: {
          summary: "Criar nova demanda",
          tags: ["Demandas"],
          description: "Endpoint para criar novas demandas no sistema via API. Valida se a demanda já existe antes de criar.",
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
                        }
                      ]
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
                  }
                }
              }
            },
            "409": {
              description: "Demanda já existe no sistema",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ConflictError"
                  }
                }
              }
            },
            "400": {
              description: "Dados inválidos"
            }
          }
        }
      },
      "/consultants": {
        get: {
          summary: "Listar consultores",
          tags: ["Consultants"],
          parameters: [
            {
              name: "name",
              in: "query",
              description: "Filtrar por nome (busca parcial)",
              schema: { type: "string" }
            },
            {
              name: "email",
              in: "query", 
              description: "Filtrar por email",
              schema: { type: "string" }
            },
            {
              name: "phone",
              in: "query",
              description: "Filtrar por telefone",
              schema: { type: "string" }
            },
            {
              name: "city",
              in: "query",
              description: "Filtrar por cidade",
              schema: { type: "string" }
            },
            {
              name: "state",
              in: "query",
              description: "Filtrar por estado",
              schema: { type: "string" }
            },
            {
              name: "limit",
              in: "query",
              description: "Limite de registros por página",
              schema: { type: "integer", default: 50 }
            },
            {
              name: "offset",
              in: "query",
              description: "Número de registros para pular (paginação)",
              schema: { type: "integer", default: 0 }
            },
            {
              name: "order",
              in: "query",
              description: "Campo para ordenação (name, email, created_at)",
              schema: { type: "string", default: "name" }
            }
          ],
          responses: {
            "200": {
              description: "Lista de consultores",
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
          summary: "Criar consultor",
          tags: ["Consultants"],
          description: "Criar novo consultor. Valida se já existe consultor com o mesmo email.",
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
              description: "Consultor criado com sucesso"
            },
            "409": {
              description: "Consultor com este email já existe",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ConflictError"
                  }
                }
              }
            }
          }
        }
      },
      "/projects": {
        get: {
          summary: "Listar projetos",
          tags: ["Projects"],
          parameters: [
            {
              name: "name",
              in: "query",
              description: "Filtrar por nome do projeto",
              schema: { type: "string" }
            },
            {
              name: "status",
              in: "query",
              description: "Filtrar por status",
              schema: { type: "string" }
            },
            {
              name: "client_id",
              in: "query",
              description: "Filtrar por ID do cliente",
              schema: { type: "string", format: "uuid" }
            },
            {
              name: "main_consultant_id",
              in: "query",
              description: "Filtrar por consultor principal",
              schema: { type: "string", format: "uuid" }
            },
            {
              name: "service_id",
              in: "query",
              description: "Filtrar por serviço",
              schema: { type: "string", format: "uuid" }
            },
            {
              name: "start_date_from",
              in: "query",
              description: "Data de início a partir de (YYYY-MM-DD)",
              schema: { type: "string", format: "date" }
            },
            {
              name: "start_date_to",
              in: "query",
              description: "Data de início até (YYYY-MM-DD)",
              schema: { type: "string", format: "date" }
            },
            {
              name: "total_value_min",
              in: "query",
              description: "Valor mínimo do projeto",
              schema: { type: "number" }
            },
            {
              name: "total_value_max",
              in: "query",
              description: "Valor máximo do projeto",
              schema: { type: "number" }
            },
            {
              name: "limit",
              in: "query",
              description: "Limite de registros por página",
              schema: { type: "integer", default: 50 }
            },
            {
              name: "offset",
              in: "query",
              description: "Número de registros para pular",
              schema: { type: "integer", default: 0 }
            },
            {
              name: "order",
              in: "query",
              description: "Campo para ordenação",
              schema: { type: "string", default: "created_at" }
            }
          ],
          responses: {
            "200": {
              description: "Lista de projetos",
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
          summary: "Criar projeto",
          tags: ["Projects"],
          description: "Criar novo projeto. Valida se já existe projeto com o mesmo nome para o mesmo cliente.",
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
              description: "Projeto criado com sucesso"
            },
            "409": {
              description: "Projeto com este nome já existe para este cliente",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ConflictError"
                  }
                }
              }
            }
          }
        }
      },
      "/services": {
        get: {
          summary: "Listar serviços",
          tags: ["Services"],
          parameters: [
            {
              name: "name",
              in: "query",
              description: "Filtrar por nome do serviço",
              schema: { type: "string" }
            },
            {
              name: "description",
              in: "query",
              description: "Filtrar por descrição (busca parcial)",
              schema: { type: "string" }
            },
            {
              name: "total_hours_min",
              in: "query",
              description: "Horas mínimas",
              schema: { type: "number" }
            },
            {
              name: "total_hours_max",
              in: "query",
              description: "Horas máximas",
              schema: { type: "number" }
            },
            {
              name: "hourly_rate_min",
              in: "query",
              description: "Valor mínimo por hora",
              schema: { type: "number" }
            },
            {
              name: "hourly_rate_max",
              in: "query",
              description: "Valor máximo por hora",
              schema: { type: "number" }
            },
            {
              name: "total_value_min",
              in: "query",
              description: "Valor total mínimo",
              schema: { type: "number" }
            },
            {
              name: "total_value_max",
              in: "query",
              description: "Valor total máximo",
              schema: { type: "number" }
            },
            {
              name: "limit",
              in: "query",
              description: "Limite de registros por página",
              schema: { type: "integer", default: 50 }
            },
            {
              name: "offset",
              in: "query",
              description: "Número de registros para pular",
              schema: { type: "integer", default: 0 }
            },
            {
              name: "order",
              in: "query",
              description: "Campo para ordenação",
              schema: { type: "string", default: "name" }
            }
          ],
          responses: {
            "200": {
              description: "Lista de serviços",
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
        },
        post: {
          summary: "Criar serviço",
          tags: ["Services"],
          description: "Criar novo serviço. Valida se já existe serviço com o mesmo nome.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ServiceInput"
                },
                examples: {
                  exemplo_basico: {
                    summary: "Exemplo básico de serviço",
                    value: {
                      name: "Desenvolvimento Web",
                      description: "Desenvolvimento de aplicações web completas",
                      total_hours: 160,
                      hourly_rate: 125.00,
                      total_value: 20000.00,
                      tax_rate: 16,
                      extra_costs: 500.00
                    }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Serviço criado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Service"
                  }
                }
              }
            },
            "409": {
              description: "Serviço com este nome já existe",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ConflictError"
                  }
                }
              }
            },
            "400": {
              description: "Dados inválidos"
            }
          }
        }
      },
      "/clients": {
        get: {
          summary: "Listar clientes",
          tags: ["Clients"],
          parameters: [
            {
              name: "name",
              in: "query",
              description: "Filtrar por nome do cliente",
              schema: { type: "string" }
            },
            {
              name: "contact_name",
              in: "query",
              description: "Filtrar por nome do contato",
              schema: { type: "string" }
            },
            {
              name: "email",
              in: "query",
              description: "Filtrar por email",
              schema: { type: "string" }
            },
            {
              name: "phone",
              in: "query",
              description: "Filtrar por telefone",
              schema: { type: "string" }
            },
            {
              name: "city",
              in: "query",
              description: "Filtrar por cidade",
              schema: { type: "string" }
            },
            {
              name: "state",
              in: "query",
              description: "Filtrar por estado",
              schema: { type: "string" }
            },
            {
              name: "limit",
              in: "query",
              description: "Limite de registros por página",
              schema: { type: "integer", default: 50 }
            },
            {
              name: "offset",
              in: "query",
              description: "Número de registros para pular",
              schema: { type: "integer", default: 0 }
            },
            {
              name: "order",
              in: "query",
              description: "Campo para ordenação",
              schema: { type: "string", default: "name" }
            }
          ],
          responses: {
            "200": {
              description: "Lista de clientes",
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
        },
        post: {
          summary: "Criar cliente",
          tags: ["Clients"],
          description: "Criar novo cliente. Valida se já existe cliente com o mesmo nome ou email.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ClientInput"
                },
                examples: {
                  exemplo_completo: {
                    summary: "Exemplo completo de cliente",
                    value: {
                      name: "Tech Solutions Ltda",
                      contact_name: "João Silva",
                      email: "contato@techsolutions.com",
                      phone: "(11) 99999-9999",
                      address: "Rua das Flores, 123",
                      city: "São Paulo",
                      state: "SP",
                      zip_code: "01234-567",
                      notes: "Cliente premium com histórico de projetos grandes"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Cliente criado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Client"
                  }
                }
              }
            },
            "409": {
              description: "Cliente já existe (mesmo nome ou email)",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ConflictError"
                  }
                }
              }
            },
            "400": {
              description: "Dados inválidos"
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
              description: "Webhook subscription created successfully"
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
        <AlertTitle>🎯 API Atualizada com Filtros e Validações</AlertTitle>
        <AlertDescription>
          <p className="mb-3">A API foi atualizada com as seguintes melhorias:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ Todos os endpoints GET agora têm filtros avançados</li>
            <li>✅ Métodos POST adicionados para /clients e /services</li>
            <li>✅ Endpoint de demandas corrigido para /demands</li>
            <li>✅ Validação de duplicatas com código 409 em todos os POSTs</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Collapsible open={isMainUpdatesOpen} onOpenChange={setIsMainUpdatesOpen}>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Webhook className="h-5 w-5" />
                  Principais Atualizações da API
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isMainUpdatesOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
            <CardDescription className="text-blue-600 dark:text-blue-400">
              Novos recursos e melhorias implementados
            </CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Filtros Avançados nos GETs</h4>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border">
                  <p className="mb-2"><strong>Exemplos de filtros disponíveis:</strong></p>
                  <ul className="text-xs space-y-1">
                    <li>• <code>/consultants?name=João&city=São Paulo&limit=10</code></li>
                    <li>• <code>/projects?status=active&total_value_min=5000</code></li>
                    <li>• <code>/services?hourly_rate_min=100&hourly_rate_max=200</code></li>
                    <li>• <code>/clients?state=SP&order=name&limit=20</code></li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Novos Endpoints POST</h4>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded border border-green-200">
                  <ul className="text-xs space-y-1">
                    <li>• <strong>POST /clients</strong> - Criar novos clientes</li>
                    <li>• <strong>POST /services</strong> - Criar novos serviços</li>
                    <li>• <strong>POST /demands</strong> - Endpoint corrigido para demandas</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Validação de Duplicatas (409)</h4>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded border border-yellow-200">
                  <p className="mb-2">Todos os POSTs agora validam duplicatas:</p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Clientes:</strong> Nome ou email duplicado</li>
                    <li>• <strong>Serviços:</strong> Nome duplicado</li>
                    <li>• <strong>Consultores:</strong> Email duplicado</li>
                    <li>• <strong>Projetos:</strong> Nome duplicado para o mesmo cliente</li>
                    <li>• <strong>Demandas:</strong> Nome duplicado para o mesmo cliente</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Endpoint de Demandas Corrigido</h4>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded border border-purple-200">
                  <p><strong>Novo endpoint:</strong></p>
                  <code className="text-xs block mt-1">POST /demands</code>
                  <p className="mt-2 text-xs">(anteriormente era /webhooks/api/demands)</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">5. Exemplo de Resposta 409</h4>
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded border border-red-200">
                  <pre className="text-xs overflow-x-auto">
{`{
  "error": "Registro já existe",
  "code": 409,
  "message": "Um cliente com este nome já foi cadastrado",
  "existing_id": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-15T10:30:00Z"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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

      <Collapsible open={isSwaggerDocsOpen} onOpenChange={setIsSwaggerDocsOpen}>
        <Card className="shadow-card">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <CardTitle>Swagger Documentation</CardTitle>
                  <CardDescription>
                    Documentação interativa da API ConsultorPRO usando OpenAPI
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isSwaggerDocsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <SwaggerUI spec={spec} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default SwaggerDocs;
