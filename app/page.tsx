// app/page.tsx - Version API-only (sans interface)
export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1>🚀 Laundry Management API</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        API Server Running Successfully
      </p>
      
      <div style={{ 
        margin: '3rem auto', 
        padding: '2rem', 
        border: '2px dashed #007bff', 
        borderRadius: '8px',
        maxWidth: '600px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>📡 Ready for API Testing</h2>
        <p>Use tools like:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✅ Postman</li>
          <li>✅ Thunder Client (VS Code)</li>
          <li>✅ Insomnia</li>
          <li>✅ curl commands</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>🔗 Base URL:</h3>
        <code style={{ 
          backgroundColor: '#e9ecef', 
          padding: '0.5rem 1rem', 
          borderRadius: '4px',
          fontSize: '1.1rem'
        }}>
          http://localhost:3000/api
        </code>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>🔐 Authentication:</h3>
        <p>Get your token from: <code>/api/auth/signin</code></p>
        <p>Use: <code>Authorization: Bearer [your-token]</code></p>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <p>🎯 Interface supprimée - Mode API uniquement</p>
        <p>Consultez la documentation des endpoints dans votre projet</p>
      </div>
    </main>
  )
}