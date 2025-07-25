// Professional login and dashboard UI for Idle No More Desktop

const API_BASE = 'http://127.0.0.1:8000/api';

const app = document.getElementById('app');

// Global state for active time tracking
let activeTracking = null;
let pollingInterval = null;
let timerInterval = null;
let heartbeatInterval = null;

function renderLogin(message = '') {
  app.innerHTML = `
    <div class="centered-card">
      <img src="idle-no-more-logo.png" alt="Idle No More Logo" class="logo" />
      <h1>Idle No More Desktop</h1>
      <form id="login-form" class="card">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required autocomplete="current-password" />
        </div>
        <button type="submit" class="btn">Log In</button>
        <div class="form-message">${message}</div>
      </form>
    </div>
  `;
  document.getElementById('login-form').onsubmit = handleLogin;
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch(`${API_BASE}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json();
      renderLogin(data.detail || 'Login failed.');
      return;
    }
    const data = await res.json();
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    fetchAndRenderDashboard(data.access);
  } catch (err) {
    renderLogin('Network error. Please try again.');
  }
}

async function fetchAndRenderDashboard(token) {
  try {
    const res = await fetch(`${API_BASE}/employees/me/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      renderLogin('Session expired. Please log in again.');
      return;
    }
    const data = await res.json();
    // Fetch projects for time logging panel
    const projects = await fetchUserProjects(token);
    renderDashboard(data, projects, token);
    
    // Start polling for active time tracking
    startPolling(token);
  } catch (err) {
    renderLogin('Network error. Please try again.');
  }
}

function startPolling(token) {
  // Check immediately on load
  checkActiveTracking(token);
}

function startActivePolling(token) {
  // Clear any existing polling interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Poll every 5 seconds when tracking is active
  pollingInterval = setInterval(() => {
    checkActiveTracking(token);
  }, 5000);
}

function stopActivePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function startHeartbeat(token, trackingId) {
  // Clear any existing heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Send heartbeat every 2 seconds
  heartbeatInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/time-tracking/heartbeat/${trackingId}/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.warn('Heartbeat failed:', res.status);
        // Don't stop heartbeat on failure, just log it
      } else {
        console.log('Heartbeat sent successfully');
      }
    } catch (err) {
      console.warn('Heartbeat error:', err);
    }
  }, 2000);
  
  // Send initial heartbeat immediately
  fetch(`${API_BASE}/time-tracking/heartbeat/${trackingId}/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).catch(err => console.warn('Initial heartbeat error:', err));
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

async function checkActiveTracking(token) {
  try {
    const res = await fetch(`${API_BASE}/time-tracking/active/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 404) {
      // No active tracking
      if (activeTracking) {
        activeTracking = null;
        updateTrackingUI();
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        stopHeartbeat();
        stopActivePolling();
      }
      return;
    }
    
    if (!res.ok) {
      console.error('Error checking active tracking:', res.status);
      return;
    }
    
    const trackingData = await res.json();
    activeTracking = trackingData;
    updateTrackingUI();
    
    // Start heartbeat if not already running
    if (!heartbeatInterval) {
      startHeartbeat(token, trackingData.id);
    }
    
    // Start active polling if not already running
    if (!pollingInterval) {
      startActivePolling(token);
    }
    
    // Check if 15 seconds have passed
    const startTime = new Date(trackingData.start_time);
    const now = new Date();
    const elapsedSeconds = (now - startTime) / 1000;
    
    if (elapsedSeconds >= 15) {
      // Auto-end the tracking
      await endTimeTracking(token, trackingData.id);
    } else {
      // Start timer if not already running
      if (!timerInterval) {
        startTimer(startTime);
      }
    }
    
  } catch (err) {
    console.error('Error checking active tracking:', err);
  }
}

function startTimer(startTime) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    const now = new Date();
    const elapsed = now - startTime;
    const seconds = Math.floor(elapsed / 1000);
    
    // Update timer display
    const timerElement = document.getElementById('tracking-timer');
    if (timerElement) {
      timerElement.textContent = formatTime(seconds);
    }
    
    // Check if 15 seconds have passed
    if (seconds >= 15) {
      clearInterval(timerInterval);
      timerInterval = null;
      // Auto-end will be handled by the polling
    }
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function endTimeTracking(token, trackingId) {
  try {
    const res = await fetch(`${API_BASE}/time-tracking/end/${trackingId}/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      activeTracking = null;
      updateTrackingUI();
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      stopHeartbeat();
      alert('Time tracking ended successfully!');
      
      // Verify tracking has ended
      setTimeout(() => {
        checkActiveTracking(token);
      }, 500);
    } else {
      alert('Failed to end time tracking.');
    }
  } catch (err) {
    alert('Network error while ending time tracking.');
  }
}

function updateTrackingUI() {
  const trackingPanel = document.getElementById('tracking-status-panel');
  const startButton = document.getElementById('start-timelog-btn');
  
  if (!trackingPanel) return;
  
  if (activeTracking) {
    const startTime = new Date(activeTracking.start_time);
    const elapsed = Math.floor((new Date() - startTime) / 1000);
    
    trackingPanel.innerHTML = `
      <div class="tracking-active">
        <div class="tracking-header">
          <h4>🟢 Active Time Tracking</h4>
          <div class="tracking-timer" id="tracking-timer">${formatTime(elapsed)}</div>
        </div>
        <div class="tracking-details">
          <p><strong>Task:</strong> ${activeTracking.task_id}</p>
          <p><strong>Description:</strong> ${activeTracking.description || 'No description'}</p>
          <p><strong>Started:</strong> ${startTime.toLocaleTimeString()}</p>
          <p><strong>Heartbeat:</strong> <span class="heartbeat-status">🟢 Active</span></p>
        </div>
        <button class="btn btn-danger" id="end-tracking-btn">End Tracking</button>
      </div>
    `;
    
    // Add event listener for end button
    document.getElementById('end-tracking-btn').onclick = () => {
      const token = localStorage.getItem('access');
      if (token && activeTracking) {
        endTimeTracking(token, activeTracking.id);
      }
    };
    
    // Disable start tracking button
    if (startButton) {
      startButton.disabled = true;
      startButton.textContent = 'Tracking Active';
      startButton.className = 'btn btn-disabled';
    }
    
    // Start timer if not already running
    if (!timerInterval) {
      startTimer(startTime);
    }
  } else {
    trackingPanel.innerHTML = `
      <div class="tracking-inactive">
        <h4>⏸️ No Active Tracking</h4>
        <p>Start tracking time for your tasks below.</p>
      </div>
    `;
    
    // Enable start tracking button
    if (startButton) {
      startButton.disabled = false;
      startButton.textContent = 'Start Logging Time';
      startButton.className = 'btn';
    }
  }
}

async function fetchUserProjects(token) {
  try {
    const res = await fetch(`${API_BASE}/employees/me/projects/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchTasksForProject(token, projectId) {
  try {
    const res = await fetch(`${API_BASE}/employees/me/tasks/?project_id=${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function getSystemInfo() {
  const userAgent = navigator.userAgent;
  let os = 'Unknown';
  let version = 'Unknown';
  
  if (userAgent.includes('Mac')) {
    os = 'macOS';
    // Extract macOS version if possible
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      version = match[1].replace('_', '.');
    }
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      version = match[1];
    }
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }
  
  return {
    os: os,
    version: version,
    browser: navigator.appName || 'Unknown'
  };
}

function showTimeTrackingModal(token, selectedTaskId, selectedProjectName, selectedTaskName) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Start Time Tracking</h3>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Project & Task</label>
          <div class="selected-info">
            <strong>${selectedProjectName}</strong> → <strong>${selectedTaskName}</strong>
          </div>
        </div>
        <div class="form-group">
          <label for="description">Description (Optional)</label>
          <textarea id="description" placeholder="What are you working on?" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="timezone">Timezone</label>
          <select id="timezone" class="timelog-select">
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="Asia/Kolkata" selected>Asia/Kolkata</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
            <option value="Australia/Sydney">Australia/Sydney</option>
            <option value="Africa/Johannesburg">Africa/Johannesburg</option>
            <option value="Pacific/Auckland">Pacific/Auckland</option>
          </select>
        </div>
        <div class="form-group">
          <label>Device Details (Auto-detected)</label>
          <div class="device-info">
            <span>OS: ${getSystemInfo().os} ${getSystemInfo().version}</span>
            <span>Browser: ${getSystemInfo().browser}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn" id="modal-start">Start Tracking</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal handlers
  document.getElementById('modal-close').onclick = () => document.body.removeChild(modal);
  document.getElementById('modal-cancel').onclick = () => document.body.removeChild(modal);
  
  // Start tracking handler
  document.getElementById('modal-start').onclick = async () => {
    console.log('Start tracking button clicked');
    const description = document.getElementById('description').value;
    const timezone = document.getElementById('timezone').value;
    const deviceDetails = getSystemInfo();
    
    console.log('Sending request with:', { selectedTaskId, timezone, description, deviceDetails });
    
    try {
      const res = await fetch(`${API_BASE}/time-tracking/start/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: selectedTaskId,
          timezone: timezone,
          description: description,
          mac: "00:1A:2B:3C:4D:5E", // Placeholder - would need Node.js to get real MAC
          ip: "192.168.1.100", // Placeholder - would need Node.js to get real IP
          device_details: deviceDetails
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        alert(`Failed to start tracking: ${errorData.detail || 'Unknown error'}`);
        return;
      }
      
      const data = await res.json();
      console.log('Success response:', data);
      alert('Time tracking started successfully!');
      document.body.removeChild(modal);
      
      // Check for active tracking after starting
      setTimeout(() => {
        checkActiveTracking(token);
      }, 500); // Small delay to ensure the backend has processed the start request
      
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };
}

function renderDashboard(data, assignedProjects, token) {
  const { employee, projects, tasks } = data;
  // Default: select first project, then fetch its tasks
  let selectedProjectId = assignedProjects.length > 0 ? assignedProjects[0].id : null;
  let selectedTaskId = null;
  let currentTasks = [];

  app.innerHTML = `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="idle-no-more-logo.png" alt="Idle No More Logo" class="logo large" />
          <div class="brand-title">IDLE NO MORE</div>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">${employee.first_name ? employee.first_name[0] : employee.username[0]}</div>
          <div class="user-name">${employee.first_name || employee.username}</div>
          <div class="user-role">${employee.role}</div>
        </div>
        <button class="btn btn-logout" id="logout-btn">Log Out</button>
      </aside>
      <main class="dashboard-main">
        <div class="dashboard-header">
          <h2>Welcome, ${employee.first_name || employee.username}!</h2>
        </div>
        <div class="dashboard-content-flex">
          <div class="dashboard-cards dashboard-cards-vertical">
            <div class="card user-info gradient-card">
              <h3>User Details</h3>
              <p><strong>Username:</strong> ${employee.username}</p>
              <p><strong>Email:</strong> ${employee.email}</p>
              <p><strong>Status:</strong> ${employee.is_active ? 'Active' : 'Inactive'}</p>
            </div>
            <div class="card project-list gradient-card">
              <h3>Your Projects</h3>
              <ul class="simple-list">
                ${assignedProjects.length === 0 ? '<li>No projects assigned.</li>' : assignedProjects.map(p => `<li><span class='project-name'>${p.name}</span> <span class='project-people'>(${p.employees.length} people)</span></li>`).join('')}
              </ul>
            </div>
            <div class="card task-list gradient-card">
              <h3>Your Tasks</h3>
              <ul class="simple-list">
                ${tasks.length === 0 ? '<li>No tasks assigned.</li>' : tasks.map(t => `<li>${t.name}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="dashboard-right-panel">
            <div class="dashboard-timelog-panel card">
              <h3>Log Your Time</h3>
              <div class="form-group">
                <label for="timelog-project">Project</label>
                <select id="timelog-project" class="timelog-select">
                  ${assignedProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="timelog-task">Task</label>
                <select id="timelog-task" class="timelog-select">
                  <option value="">Select a project first</option>
                </select>
              </div>
              <button class="btn" id="start-timelog-btn">Start Logging Time</button>
            </div>
            <div class="card tracking-status-card" id="tracking-status-panel">
              <div class="tracking-inactive">
                <h4>⏸️ No Active Tracking</h4>
                <p>Start tracking time for your tasks below.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
  document.getElementById('logout-btn').onclick = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    stopHeartbeat();
    stopActivePolling();
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    renderLogin();
  };

  // Time logging panel logic
  const projectSelect = document.getElementById('timelog-project');
  const taskSelect = document.getElementById('timelog-task');
  if (projectSelect) {
    // On load, fetch tasks for first project
    if (selectedProjectId) {
      fetchTasksForProject(token, selectedProjectId).then(tasks => {
        currentTasks = tasks;
        updateTaskSelect(tasks);
      });
    }
    projectSelect.onchange = function () {
      selectedProjectId = this.value;
      fetchTasksForProject(token, selectedProjectId).then(tasks => {
        currentTasks = tasks;
        updateTaskSelect(tasks);
      });
    };
  }
  function updateTaskSelect(tasks) {
    if (!taskSelect) return;
    if (!tasks || tasks.length === 0) {
      taskSelect.innerHTML = '<option value="">No tasks for this project</option>';
      return;
    }
    taskSelect.innerHTML = tasks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }
  document.getElementById('start-timelog-btn').onclick = function () {
    const selectedTask = taskSelect.value;
    if (!selectedTask) {
      alert('Please select a task first.');
      return;
    }
    
    const selectedProject = projectSelect.options[projectSelect.selectedIndex].text;
    const selectedTaskName = taskSelect.options[taskSelect.selectedIndex].text;
    
    showTimeTrackingModal(token, selectedTask, selectedProject, selectedTaskName);
  };
}

// On load, check for token and try to fetch dashboard
const access = localStorage.getItem('access');
if (access) {
  fetchAndRenderDashboard(access);
} else {
  renderLogin();
} 