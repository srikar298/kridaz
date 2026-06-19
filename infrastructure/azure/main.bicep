// Azure Infrastructure for Kridaz
// Provisions Azure Container Registry, Log Analytics Workspace,
// Azure Container Apps Environment, and the 4 ACA instances.

param location string = resourceGroup().location
param environmentName string = 'kridaz-env'
param registryName string = 'kridazacr${uniqueString(resourceGroup().id)}'
param dbUrl string // Passed securely from pipeline or vault
param redisUrl string // Passed securely
param metricsSecret string // Passed securely
param encryptionSecret string // Passed securely

// 1. Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// 2. Azure Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// 3. Azure Container Apps Environment
resource acaEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// 4. API Container App
resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'kridaz-api'
  location: location
  properties: {
    managedEnvironmentId: acaEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 4000
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'db-url'
          value: dbUrl
        }
        {
          name: 'redis-url'
          value: redisUrl
        }
        {
          name: 'metrics-secret'
          value: metricsSecret
        }
        {
          name: 'encryption-secret'
          value: encryptionSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'kridaz-api'
          image: '${acr.properties.loginServer}/kridaz-api:latest'
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'db-url'
            }
            {
              name: 'REDIS_URL'
              secretRef: 'redis-url'
            }
            {
              name: 'METRICS_SECRET'
              secretRef: 'metrics-secret'
            }
            {
              name: 'ENCRYPTION_SECRET'
              secretRef: 'encryption-secret'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'ENABLE_WORKERS'
              value: 'false'
            }
            {
              name: 'PORT'
              value: '4000'
            }
          ]
          resources: {
            cpu: json('1.0')
            memory: '2.0Gi'
          }
        }
      ]
      // Run migrations in an Init Container before starting the main API
      initContainers: [
        {
          name: 'migrate'
          image: '${acr.properties.loginServer}/kridaz-api:latest'
          command: [
            'pnpm', 'run', 'migrate'
          ]
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'db-url'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
}

// 5. Worker Container App
resource workerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'kridaz-worker'
  location: location
  properties: {
    managedEnvironmentId: acaEnv.id
    configuration: {
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'db-url'
          value: dbUrl
        }
        {
          name: 'redis-url'
          value: redisUrl
        }
        {
          name: 'encryption-secret'
          value: encryptionSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'kridaz-worker'
          image: '${acr.properties.loginServer}/kridaz-worker:latest'
          command: [
            'pnpm', 'run', 'worker'
          ]
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'db-url'
            }
            {
              name: 'REDIS_URL'
              secretRef: 'redis-url'
            }
            {
              name: 'ENCRYPTION_SECRET'
              secretRef: 'encryption-secret'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'ENABLE_WORKERS'
              value: 'true'
            }
          ]
          resources: {
            cpu: json('1.0')
            memory: '2.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// 6. User Web Container App
resource userWebApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'kridaz-user-web'
  location: location
  properties: {
    managedEnvironmentId: acaEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'kridaz-user-web'
          image: '${acr.properties.loginServer}/kridaz-user-web:latest'
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// 7. Admin Web Container App
resource adminWebApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'kridaz-admin-web'
  location: location
  properties: {
    managedEnvironmentId: acaEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'kridaz-admin-web'
          image: '${acr.properties.loginServer}/kridaz-admin-web:latest'
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}
