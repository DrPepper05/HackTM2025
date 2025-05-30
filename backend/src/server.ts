import app from './app'
import { supabaseAdmin } from './config/supabase.config'

const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

async function startServer() {
  try {
    // Test database connection
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error.message)
      process.exit(1)
    }

    console.log('✅ Database connection successful')

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`
🚀 OpenArchive API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: ${NODE_ENV}
🌐 Server URL:  http://localhost:${PORT}
📋 API Base:    http://localhost:${PORT}/api/v1
🏥 Health:      http://localhost:${PORT}/api/v1/health
📚 Auth:        http://localhost:${PORT}/api/v1/auth
🔍 Search:      http://localhost:${PORT}/api/v1/search
📄 Documents:   http://localhost:${PORT}/api/v1/documents
🔧 Admin:       http://localhost:${PORT}/api/v1/admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏛️  Romanian Government Document Archive System
   Ready to serve document management requests!
      `)
    })

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🛑 Received shutdown signal, closing server...')
      server.close(() => {
        console.log('✅ Server closed successfully')
        process.exit(0)
      })
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

export default app 