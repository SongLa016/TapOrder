import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Realtime Memory Database for cross-device synchronization
interface AppState {
  restaurant: any
  menu: any[]
  tables: any[]
  orders: any[]
}

const appState: AppState = {
  restaurant: null,
  menu: [],
  tables: [],
  orders: []
}

let sseClients: any[] = []

function broadcast(event: string, data: any) {
  sseClients.forEach(client => {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  })
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'api-sync-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Parse request URL
          const host = req.headers.host || 'localhost'
          const url = new URL(req.url || '', `http://${host}`)
          
          // SSE events channel
          if (url.pathname === '/api/events') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*'
            })
            res.write('\n')
            sseClients.push(res)
            
            req.on('close', () => {
              sseClients = sseClients.filter(c => c !== res)
            })
            return
          }

          // GET / POST state
          if (url.pathname === '/api/state') {
            if (req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(appState))
              return
            }
            
            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => {
                body += chunk
              })
              req.on('end', () => {
                try {
                  const updates = JSON.parse(body)
                  
                  if (updates.restaurant !== undefined) appState.restaurant = updates.restaurant
                  if (updates.menu !== undefined) appState.menu = updates.menu
                  
                  if (updates.tables !== undefined) {
                    if (updates.modifiedTableNumbers !== undefined && Array.isArray(updates.modifiedTableNumbers)) {
                      // Partially update only the modified tables
                      appState.tables = appState.tables.map((t: any) => {
                        if (updates.modifiedTableNumbers.includes(t.number)) {
                          const incoming = updates.tables.find((it: any) => it.number === t.number)
                          return incoming ? { ...t, ...incoming } : t
                        }
                        return t
                      })
                      // Append any new tables added by manager
                      updates.tables.forEach((it: any) => {
                        if (!appState.tables.some((t: any) => t.number === it.number)) {
                          appState.tables.push(it)
                        }
                      })
                    } else {
                      // Fallback for complete overrides (e.g. initial seed)
                      appState.tables = updates.tables
                    }
                  }

                  if (updates.orders !== undefined) {
                    // Merge orders by ID to prevent concurrent overwrite
                    const serverOrderMap = new Map(appState.orders.map((o: any) => [o.id, o]))
                    updates.orders.forEach((newOrder: any) => {
                      const existing = serverOrderMap.get(newOrder.id)
                      if (!existing) {
                        appState.orders.push(newOrder)
                      } else {
                        Object.assign(existing, newOrder)
                      }
                    })
                    // Maintain descending chronological order
                    appState.orders.sort((a: any, b: any) => b.timestamp - a.timestamp)
                  }
                  
                  broadcast('state-updated', {
                    state: appState,
                    actionContext: updates.actionContext
                  })
                  
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: true }))
                } catch (e) {
                  res.writeHead(400, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: 'Invalid JSON' }))
                }
              })
              return
            }
          }

          next()
        })
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
})
