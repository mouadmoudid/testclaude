'use client';

import { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Login successful! 
        
🔑 Your token: ${data.token}

📋 Copy this token and use it in your API requests with:
Authorization: Bearer ${data.token}

You can now test the APIs.`);
        // Redirect or update UI as needed
      } else {
        setMessage(`❌ Error: ${data.error || 'Login failed'}`);
      }
    } catch (error) {
      setMessage('❌ Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testAccounts = [
    { email: 'superadmin@laundry.com', password: 'superadmin123', role: 'Super Admin' },
    { email: 'admin@quickwash.com', password: 'admin123', role: 'Laundry Admin' },
    { email: 'customer1@example.com', password: 'customer123', role: 'Customer' },
  ];

  const fillAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🔐 Sign In</h1>
      
      <form onSubmit={handleSignIn} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {message && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          marginBottom: '2rem'
        }}>
          {message}
        </div>
      )}

      <div>
        <h2>🧪 Test Accounts</h2>
        <p>Click on an account to fill the form:</p>
        {testAccounts.map((account, index) => (
          <div 
            key={index}
            onClick={() => fillAccount(account.email, account.password)}
            style={{ 
              padding: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              marginBottom: '0.5rem',
              cursor: 'pointer',
              backgroundColor: '#f8f9fa'
            }}
          >
            <strong>{account.role}</strong><br />
            Email: {account.email}<br />
            Password: {account.password}
          </div>
        ))}
      </div>
    </div>
  );
}