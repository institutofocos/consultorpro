
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import "swagger-ui-react/swagger-ui.css";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SwaggerDocs: React.FC = () => {
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
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "apikey"
        },
        authToken: {
          type: "apiKey",
          in: "header",
          name: "Authorization"
        }
      },
      schemas: {
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Swagger Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <SwaggerUI spec={spec} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SwaggerDocs;
