import type { NodeConfig, EdgeConfig, NodeType } from '../types/topology'

/**
 * Auto-layouts nodes left-to-right based on node type ranks and connection structures.
 */
export function autoLayoutTopology(nodes: NodeConfig[], _edges: EdgeConfig[]): NodeConfig[] {
  // Define ranks for left-to-right structure
  const typeRanks: Record<NodeType, number> = {
    API_GATEWAY: 0,
    LOAD_BALANCER: 1,
    CDN: 1,
    CDN_EDGE: 1,
    SERVICE: 2,
    MESSAGE_QUEUE: 3,
    KAFKA: 3,
    RABBITMQ: 3,
    DATABASE: 4,
    ELASTICSEARCH: 4,
    REDIS: 4,
    EXTERNAL_SERVICE: 4,
  }

  // Calculate ranks
  const nodeRanks: Record<string, number> = {}
  nodes.forEach(n => {
    nodeRanks[n.id] = typeRanks[n.type] ?? 2
  })

  // Group nodes by rank
  const rankGroups: Record<number, NodeConfig[]> = {}
  nodes.forEach(n => {
    const r = nodeRanks[n.id]
    if (!rankGroups[r]) rankGroups[r] = []
    rankGroups[r].push(n)
  })

  // Assign coordinate positions
  const xSpacing = 220
  const ySpacing = 120


  const positionedNodes = nodes.map(node => {
    const r = nodeRanks[node.id]
    const group = rankGroups[r]
    const index = group.indexOf(node)
    
    // Position calculation
    const x = 50 + r * xSpacing
    const totalHeight = (group.length - 1) * ySpacing
    const y = 250 + (index * ySpacing) - (totalHeight / 2)

    return {
      ...node,
      x,
      y,
    }
  })

  return positionedNodes
}

/**
 * Simple parser that extracts topology from docker-compose.yml structure.
 */
export function parseDockerCompose(content: string): { nodes: NodeConfig[]; edges: EdgeConfig[] } {
  const nodes: NodeConfig[] = []
  const edges: EdgeConfig[] = []

  try {
    // Basic regex-based parsing to avoid heavy yaml dependency issues
    const serviceBlockRegex = /^\s{2}([a-zA-Z0-9_-]+):\s*$/gm
    const services: string[] = []
    let match
    while ((match = serviceBlockRegex.exec(content)) !== null) {
      services.push(match[1])
    }

    if (services.length === 0) {
      throw new Error("No services found in docker-compose.yml configuration.")
    }

    // Classify nodes based on service names
    services.forEach(name => {
      let type: NodeType = 'SERVICE'
      let label = name.charAt(0).toUpperCase() + name.slice(1)

      const lower = name.toLowerCase()
      if (lower.includes('redis')) {
        type = 'REDIS'
        label = 'Redis Cache'
      } else if (lower.includes('kafka') || lower.includes('zookeeper')) {
        type = 'KAFKA'
        label = 'Kafka Broker'
      } else if (lower.includes('rabbit') || lower.includes('amqp')) {
        type = 'RABBITMQ'
        label = 'RabbitMQ'
      } else if (lower.includes('elastic') || lower.includes('es')) {
        type = 'ELASTICSEARCH'
        label = 'Elasticsearch'
      } else if (lower.includes('db') || lower.includes('postgres') || lower.includes('mongo') || lower.includes('sql')) {
        type = 'DATABASE'
      } else if (lower.includes('gateway') || lower.includes('nginx') || lower.includes('ingress') || lower.includes('proxy')) {
        type = 'API_GATEWAY'
      }

      nodes.push({
        id: name,
        type,
        label,
        x: 0,
        y: 0,
        replicas: type === 'SERVICE' ? 1 : undefined,
      })
    })

    // Infer links from depends_on / links / network settings
    // To keep it simple and robust, look for lines mentioning dependencies
    const lines = content.split('\n')
    let currentService = ''
    
    lines.forEach(line => {
      const serviceMatch = line.match(/^\s{2}([a-zA-Z0-9_-]+):\s*$/)
      if (serviceMatch) {
        currentService = serviceMatch[1]
      } else if (currentService) {
        // Look for depends_on list items or links
        const depMatch = line.match(/^\s+-\s+([a-zA-Z0-9_-]+)\s*$/)
        if (depMatch) {
          const depName = depMatch[1]
          if (services.includes(depName)) {
            const edgeId = `e-${currentService}-${depName}`
            edges.push({
              id: edgeId,
              type: 'HTTP',
              sourceId: currentService,
              targetId: depName,
            })
          }
        }
      }
    })

    // Layout the nodes
    return { nodes: autoLayoutTopology(nodes, edges), edges }
  } catch (e: any) {
    console.error(e)
    throw new Error(e.message || "Failed to parse docker-compose.yml configuration.")
  }
}

/**
 * Parser for Kubernetes Manifest files.
 */
export function parseKubernetesYaml(content: string): { nodes: NodeConfig[]; edges: EdgeConfig[] } {
  const nodes: NodeConfig[] = []
  const edges: EdgeConfig[] = []

  try {
    const yamlDocs = content.split('---')
    const serviceTargets: Record<string, string[]> = {} // svc -> selector app names
    const deployments: { name: string; replicas: number }[] = []
    const ingresses: { name: string; backendSvc: string }[] = []

    yamlDocs.forEach(doc => {
      // Find kind
      const kindMatch = doc.match(/kind:\s*(\w+)/)
      const nameMatch = doc.match(/name:\s*([a-zA-Z0-9_-]+)/)
      if (!kindMatch || !nameMatch) return

      const kind = kindMatch[1].toLowerCase()
      const name = nameMatch[1]

      if (kind === 'deployment') {
        const replicaMatch = doc.match(/replicas:\s*(\d+)/)
        const replicas = replicaMatch ? parseInt(replicaMatch[1]) : 1
        deployments.push({ name, replicas })
      } else if (kind === 'service') {
        // Extract backend selector app
        const appMatch = doc.match(/app:\s*([a-zA-Z0-9_-]+)/g)
        const targetApps = appMatch ? appMatch.map(m => m.split(':')[1].trim()) : []
        serviceTargets[name] = targetApps
      } else if (kind === 'ingress') {
        // Extract path backend services
        const svcMatch = doc.match(/serviceName:\s*([a-zA-Z0-9_-]+)/)
        if (svcMatch) {
          ingresses.push({ name, backendSvc: svcMatch[1] })
        }
      }
    })

    // Generate topology nodes
    ingresses.forEach(ing => {
      nodes.push({
        id: ing.name,
        type: 'API_GATEWAY',
        label: `${ing.name} (Ingress)`,
        x: 0,
        y: 0,
      })
    })

    Object.keys(serviceTargets).forEach(svcName => {
      nodes.push({
        id: svcName,
        type: 'LOAD_BALANCER',
        label: `${svcName} (Svc)`,
        x: 0,
        y: 0,
        algorithm: 'ROUND_ROBIN',
      })
    })

    deployments.forEach(dep => {
      nodes.push({
        id: dep.name,
        type: 'SERVICE',
        label: dep.name,
        x: 0,
        y: 0,
        replicas: dep.replicas,
      })
    })

    // Connect them
    ingresses.forEach(ing => {
      const targetSvc = ing.backendSvc
      if (nodes.some(n => n.id === targetSvc)) {
        edges.push({
          id: `e-${ing.name}-${targetSvc}`,
          type: 'HTTP',
          sourceId: ing.name,
          targetId: targetSvc,
        })
      }
    })

    Object.entries(serviceTargets).forEach(([svcName, targets]) => {
      targets.forEach(t => {
        const depNode = nodes.find(n => n.id.includes(t) || t.includes(n.id))
        if (depNode) {
          edges.push({
            id: `e-${svcName}-${depNode.id}`,
            type: 'HTTP',
            sourceId: svcName,
            targetId: depNode.id,
          })
        }
      })
    })

    return { nodes: autoLayoutTopology(nodes, edges), edges }
  } catch (e: any) {
    throw new Error("Failed to parse Kubernetes manifest. Ensure it contains standard Kind: Deployment, Service, or Ingress resources.")
  }
}

/**
 * Parser for Terraform YAML / JSON / configuration format.
 */
export function parseTerraform(content: string): { nodes: NodeConfig[]; edges: EdgeConfig[] } {
  const nodes: NodeConfig[] = []
  const edges: EdgeConfig[] = []

  try {
    // Matches resources like resource "aws_instance" "web"
    const resourceRegex = /resource\s+"([a-zA-Z0-9_-]+)"\s+"([a-zA-Z0-9_-]+)"/g
    let match
    const foundResources: { type: string; name: string; id: string }[] = []

    while ((match = resourceRegex.exec(content)) !== null) {
      const providerType = match[1]
      const name = match[2]
      foundResources.push({ type: providerType, name, id: `${providerType}.${name}` })
    }

    if (foundResources.length === 0) {
      throw new Error("No resources found. Ensure it contains Terraform resource syntax: resource \"provider_type\" \"name\".")
    }

    foundResources.forEach(res => {
      let nodeType: NodeType = 'SERVICE'
      let label = res.name

      if (res.type.includes('db') || res.type.includes('rds') || res.type.includes('dynamo')) {
        nodeType = 'DATABASE'
      } else if (res.type.includes('elb') || res.type.includes('alb') || res.type.includes('lb')) {
        nodeType = 'LOAD_BALANCER'
      } else if (res.type.includes('apigateway') || res.type.includes('api_gateway')) {
        nodeType = 'API_GATEWAY'
      } else if (res.type.includes('cloudfront')) {
        nodeType = 'CDN'
      } else if (res.type.includes('elasticache')) {
        nodeType = 'REDIS'
      }

      nodes.push({
        id: res.id,
        type: nodeType,
        label: `${label} (${res.type.split('_')[1] || 'resource'})`,
        x: 0,
        y: 0,
      })
    })

    // Link resources if one references the other
    foundResources.forEach(source => {
      foundResources.forEach(target => {
        if (source.id === target.id) return
        // Look for references (e.g., aws_instance.web.id or target name within source attributes block)
        // Check if target name appears in source definition block (simple approximation)
        const refRegex = new RegExp(`${target.type}\\.${target.name}\\b`, 'i')
        
        // Find block for source resource in content
        const blockStartIndex = content.indexOf(source.name)
        if (blockStartIndex !== -1) {
          const nextBlockIndex = content.indexOf('resource ', blockStartIndex + 1)
          const sourceBlockContent = content.substring(blockStartIndex, nextBlockIndex === -1 ? content.length : nextBlockIndex)
          if (refRegex.test(sourceBlockContent)) {
            edges.push({
              id: `e-${source.id}-${target.id}`,
              type: target.type.includes('db') ? 'DATABASE_CONN' : 'HTTP',
              sourceId: source.id,
              targetId: target.id,
            })
          }
        }
      })
    })

    return { nodes: autoLayoutTopology(nodes, edges), edges }
  } catch (e: any) {
    throw new Error(e.message || "Failed to parse Terraform configuration file.")
  }
}
