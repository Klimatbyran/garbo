# Authentication with GitHub

The API supports GitHub authentication for users who are members of the Klimatbyrån organization. Here's how to implement it in your frontend:

## React Implementation Example

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Auth Context Provider
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [user, setUser] = useState(null);
  
  // Function to handle login
  const login = () => {
    window.location.href = 'http://localhost:3000/api/auth/github/login';
  };
  
  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };
  
  // Function to fetch user profile with token
  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch('http://localhost:3000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token might be invalid
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    }
  };
  
  // Effect to load user data when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
      fetchUserProfile(token);
    }
  }, [token]);
  
  return (
    <AuthContext.Provider value={{ token, user, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Component
export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (token) {
      setToken(token);
      navigate('/dashboard');
    } else if (error) {
      console.error('Authentication error:', error);
      navigate('/login', { state: { error: 'Authentication failed' } });
    }
  }, [location, navigate, setToken]);
  
  return <div>Processing authentication...</div>;
};

// Login Button Component
export const LoginButton = () => {
  const { login } = useAuth();
  
  return (
    <button onClick={login} className="login-button">
      Login with GitHub
    </button>
  );
};

// Protected Route Component
export const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);
  
  if (!token) return null;
  
  return children;
};
```

## Setup in your React Router

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthCallback, ProtectedRoute } from './auth';
import Dashboard from './Dashboard';
import Login from './Login';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## How it works

1. When a user clicks the "Login with GitHub" button, they are redirected to `/api/auth/github/login`
2. The API redirects to GitHub's OAuth page where the user authenticates
3. GitHub redirects back to the API with an authorization code
4. The API verifies the code, checks organization membership, and generates a JWT token
5. The API redirects to the frontend's callback URL with the token
6. The frontend stores the token and uses it for authenticated API requests

## Making authenticated requests

```jsx
const fetchData = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/companies', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setCompanies(data);
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
```

## Getting the user profile

Once authenticated, you can fetch the user's profile information:

```jsx
const fetchUserProfile = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const userProfile = await response.json();
      setUser(userProfile);
      return userProfile;
    } else {
      // Handle unauthorized or other errors
      if (response.status === 401) {
        // Token might be expired, redirect to login
        logout();
      }
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
  return null;
};
```

The profile endpoint returns the following information:

```json
{
  "id": "user-id",
  "name": "User Name",
  "email": "user@example.com",
  "githubId": "github-username",
  "githubImageUrl": "https://avatars.githubusercontent.com/u/12345678"
}
```
