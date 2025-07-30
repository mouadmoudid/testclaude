export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🧺 Laundry Management Platform</h1>
      <p>Welcome to the Laundry Management Platform API</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>🔗 Available API Endpoints:</h2>
        <ul>
          <li><strong>Dashboard:</strong> <code>GET /api/admin/dashboard/overview</code></li>
          <li><strong>Laundries:</strong> <code>GET /api/admin/laundries/performance</code></li>
          <li><strong>Orders:</strong> <code>GET /api/admin/orders</code></li>
          <li><strong>Authentication:</strong> <code>POST /api/auth/signup</code></li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>👤 Test Accounts:</h2>
        <ul>
          <li><strong>Super Admin:</strong> superadmin@laundry.com / superadmin123</li>
          <li><strong>Laundry Admin:</strong> admin@quickwash.com / admin123</li>
          <li><strong>Customer:</strong> customer1@example.com / customer123</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>🚀 Next Steps:</h2>
        <p>Use a REST client (Postman, Thunder Client) to test the APIs or build a frontend interface.</p>
      </div>
    </main>
  )
}