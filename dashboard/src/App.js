import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000/api';

// Helper to get query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ActivatePage() {
  const query = useQuery();
  const code = query.get('code');
  const [status, setStatus] = useState('loading'); // loading, valid, invalid, activating, activated, error
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [access, setAccess] = useState('');
  const [refresh, setRefresh] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!code) {
      setStatus('invalid');
      return;
    }
    // Validate code
    fetch(`http://127.0.0.1:8000/api/employees/validate-code/?code=${code}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setStatus('valid');
          setAccess(data.access);
          setRefresh(data.refresh);
          setUsername(data.username);
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('invalid'));
  }, [code]);

  const handleActivate = async (e) => {
    e.preventDefault();
    setStatus('activating');
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/employees/activate-account/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Activation failed');
      setStatus('activated');
    } catch (err) {
      setError('Activation failed. Please try again.');
      setStatus('valid');
    }
  };

  if (status === 'loading') return <div className="cheerful-bg"><div className="onboard-container">Validating code...</div></div>;
  if (status === 'invalid') return <div className="cheerful-bg"><div className="onboard-container">Invalid or expired activation link.</div></div>;
  if (status === 'activated') return <div className="cheerful-bg"><div className="onboard-container"><h2>🎉 User activated successfully!</h2><p>You can now login using your updated credentials.</p></div></div>;

  // status === 'valid' or 'activating'
  return (
    <div className="cheerful-bg">
      <div className="onboard-container">
        <h2>Set Your Password</h2>
        <form className="onboard-form" onSubmit={handleActivate}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={status === 'activating'}>
            {status === 'activating' ? 'Activating...' : 'Activate Account'}
          </button>
          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
}

// Helper to fetch with auth
async function fetchWithAuth(url, token, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

function FancyBackground() {
  // Animated SVG blobs for a fancy effect
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: 'absolute', top: 0, left: 0}}>
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2B50EC" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="bg2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F8CFF" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#2B50EC" stopOpacity="0.09" />
          </linearGradient>
        </defs>
        <ellipse cx="300" cy="200" rx="340" ry="180" fill="url(#bg1)">
          <animate attributeName="cx" values="300;400;300" dur="8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="200;250;200" dur="7s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="1200" cy="700" rx="320" ry="160" fill="url(#bg2)">
          <animate attributeName="cx" values="1200;1100;1200" dur="9s" repeatCount="indefinite" />
          <animate attributeName="cy" values="700;750;700" dur="6s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  );
}

function MainApp() {
  const [step, setStep] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [onboardData, setOnboardData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  });
  const [signupUrl, setSignupUrl] = useState('');
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [assigningTasks, setAssigningTasks] = useState(false);
  const [tasksAssigned, setTasksAssigned] = useState(false);

  // Handle login form input
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // Handle onboarding form input
  const handleOnboardChange = (e) => {
    setOnboardData({ ...onboardData, [e.target.name]: e.target.value });
  };

  // Login API call
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      if (!res.ok) throw new Error('Invalid username or password');
      const data = await res.json();
      setToken(data.access);
      setStep('onboard');
      setOnboardData((prev) => ({ ...prev, username: loginData.username }));
    } catch (err) {
      setError(err.message);
    }
  };

  // Onboarding API call
  const handleOnboard = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/employees/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(onboardData),
      });
      if (!res.ok) throw new Error('Failed to onboard. Please check your details.');
      const data = await res.json();
      setUser(data.user);
      setSignupUrl(data.signup_url);
      setStep('assign_project');
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch projects when step is assign_project
  useEffect(() => {
    const fetchProjects = async () => {
      if (step === 'assign_project' && token && user) {
        try {
          // For demo, using project=1 as in your example
          const res = await fetchWithAuth(`${API_BASE}/tasks/?project=1`, token);
          if (!res.ok) throw new Error('Failed to fetch projects');
          const data = await res.json();
          setProjects(data);
        } catch (err) {
          setError('Could not load projects');
        }
      }
    };
    fetchProjects();
  }, [step, token, user]);

  // Assign project to user
  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setAssigning(true);
    setError('');
    try {
      const res = await fetchWithAuth(
        `${API_BASE}/projects/${selectedProject}/assign_employees/`,
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee_ids: [user.id] }),
        }
      );
      if (!res.ok) throw new Error('Failed to assign project');
      setAssigned(true);
      // Fetch tasks for the selected project
      const tasksRes = await fetchWithAuth(`${API_BASE}/tasks/?project=${selectedProject}`, token);
      if (!tasksRes.ok) throw new Error('Failed to fetch tasks for project');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);
      setStep('assign_tasks');
    } catch (err) {
      setError('Could not assign project.');
    } finally {
      setAssigning(false);
    }
  };

  // Handle task checkbox change
  const handleTaskCheckbox = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Assign selected tasks to user
  const handleAssignTasks = async (e) => {
    e.preventDefault();
    if (!selectedTasks.length) return;
    setAssigningTasks(true);
    setError('');
    try {
      // Assign user to each selected task
      for (const taskId of selectedTasks) {
        const res = await fetchWithAuth(
          `${API_BASE}/tasks/${taskId}/assign_employees/`,
          token,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_ids: [user.id] }),
          }
        );
        if (!res.ok) throw new Error('Failed to assign one or more tasks');
      }
      setTasksAssigned(true);
      setStep('done');
    } catch (err) {
      setError('Could not assign tasks. Make sure the user is assigned to the project first.');
    } finally {
      setAssigningTasks(false);
    }
  };

  return (
    <div className="cheerful-bg" style={{position: 'relative', zIndex: 1}}>
      <FancyBackground />
      <div style={{position: 'absolute', top: '7%', width: '100%', textAlign: 'center', zIndex: 2}}>
        <div style={{fontSize: '2.2rem', fontWeight: 800, color: '#2B50EC', letterSpacing: '-1.5px', textShadow: '0 2px 12px #2B50EC22'}}>Idle No More</div>
        <div style={{fontSize: '1.15rem', color: '#4F8CFF', fontWeight: 600, marginTop: '0.2rem', letterSpacing: '0.5px', textShadow: '0 1px 8px #4F8CFF22'}}>A Watchdog for Work.</div>
      </div>
      <div className="onboard-container" style={{position: 'relative', zIndex: 3, marginTop: '7rem'}}>
        {step === 'login' && (
          <form className="onboard-form" onSubmit={handleLogin}>
            <h2>Admin Login</h2>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={loginData.username}
              onChange={handleLoginChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
            <button type="submit">Login</button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        )}
        {step === 'onboard' && (
          <form className="onboard-form" onSubmit={handleOnboard}>
            <h2>Onboard New Employee for Your Organisation</h2>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={onboardData.username}
              onChange={handleOnboardChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={onboardData.email}
              onChange={handleOnboardChange}
              required
            />
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={onboardData.first_name}
              onChange={handleOnboardChange}
              required
            />
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={onboardData.last_name}
              onChange={handleOnboardChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Set a Password"
              value={onboardData.password}
              onChange={handleOnboardChange}
              required
            />
            <button type="submit">Onboard Me!</button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        )}
        {step === 'assign_project' && user && (
          <form className="onboard-form" onSubmit={handleAssignProject}>
            <h2>Assign Project to {user.username}</h2>
            <select
              value={selectedProject || ''}
              onChange={e => setSelectedProject(Number(e.target.value))}
              required
              style={{padding: '0.7rem 1rem', borderRadius: 8, border: '1.5px solid #E5EAF2', fontSize: '1rem', background: '#F5F7FA', color: '#22223B'}}
            >
              <option value="" disabled>Select a project</option>
              {projects.map((proj) => (
                <option key={proj.project} value={proj.project}>{proj.name}</option>
              ))}
            </select>
            <button type="submit" disabled={assigning}>{assigning ? 'Assigning...' : 'Assign Project'}</button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        )}
        {step === 'assign_tasks' && user && (
          <form className="onboard-form" onSubmit={handleAssignTasks}>
            <h2>Assign Tasks to {user.username}</h2>
            <div style={{textAlign: 'left', margin: '0 auto', maxHeight: 180, overflowY: 'auto', background: '#F5F7FA', borderRadius: 8, padding: '0.5rem 0.5rem 0.5rem 1rem', border: '1.5px solid #E5EAF2'}}>
              {tasks.length === 0 && <div style={{color: '#6B7280'}}>No tasks available for this project.</div>}
              {tasks.map((task) => (
                <div key={task.id} style={{marginBottom: 6}}>
                  <label style={{cursor: 'pointer'}}>
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => handleTaskCheckbox(task.id)}
                      style={{marginRight: 8}}
                    />
                    {task.name}
                  </label>
                </div>
              ))}
            </div>
            <button type="submit" disabled={assigningTasks || !selectedTasks.length}>
              {assigningTasks ? 'Assigning...' : 'Assign Selected Tasks'}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        )}
        {step === 'done' && user && (
          <div className="onboard-success">
            <h2>🎊 The user {user.username} is successfully onboarded!</h2>
            {(() => {
              // Extract code from signupUrl (e.g., /api/employees/activate-account/?code=828188)
              let code = '';
              try {
                const url = new URL(signupUrl, window.location.origin);
                code = url.searchParams.get('code') || '';
              } catch (e) {
                // fallback: try regex
                const match = signupUrl.match(/code=([^&]+)/);
                code = match ? match[1] : '';
              }
              const frontendLink = `${window.location.origin}/activate?code=${code}`;
              return (
                <>
                  <p>Your user should get an email with the following link:</p>
                  <a
                    className="signup-link"
                    href={frontendLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{display: 'inline-block', margin: '1rem 0', fontWeight: 700}}
                  >
                    Open Activation Link
                  </a>
                  <div style={{fontSize: '0.95rem', color: '#2B50EC', wordBreak: 'break-all'}}>{frontendLink}</div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/activate" element={<ActivatePage />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
