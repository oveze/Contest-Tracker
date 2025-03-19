import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./ContestTracker.css";

const ContestTracker = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Codeforces", "CodeChef", "Leetcode"]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [lastSync, setLastSync] = useState(null);
  const [debugInfo, setDebugInfo] = useState({ upcoming: 0, ongoing: 0, past: 0 });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    checkApiHealth();
    fetchContestsFromDB();
    
    const interval = setInterval(fetchContestsFromDB, 60000);
    return () => clearInterval(interval);
  }, [selectedPlatforms, statusFilter]);


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []); 
  const checkApiHealth = async () => {
    try {
      const response = await axios.get('http://localhost:2000/api/health');
      console.log("API Health Response:", response.data);
      setApiStatus(response.data || {});
    } catch (error) {
      console.error("Failed to check API health:", error);
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };


 
  const fetchContestsFromDB = async () => {
    try {
      setLoading(true);
      const platformsQuery = selectedPlatforms.join(",");
      
      
      try {
        const syncResponse = await axios.get('http://localhost:2000/api/last-sync');
        if (syncResponse.data && syncResponse.data.lastSync) {
          setLastSync(new Date(syncResponse.data.lastSync));
        }
      } catch (syncError) {
        console.error("Error fetching last sync time:", syncError);
      }
      
     
      let contestData = [];
      
      if (statusFilter === "All" || statusFilter === "Upcoming") {
        try {
          const upcomingResponse = await axios.get(`http://localhost:2000/api/contests?platforms=${platformsQuery}&status=upcoming`);
          const upcomingContests = Array.isArray(upcomingResponse.data) ? upcomingResponse.data : [];
          contestData = [...contestData, ...upcomingContests.map(contest => ({ ...contest, status: "upcoming" }))];
          debugInfo.upcoming = upcomingContests.length;
        } catch (error) {
          console.error("Error fetching upcoming contests:", error);
        }
      }
      
      if (statusFilter === "All" || statusFilter === "Ongoing") {
        try {
          const ongoingResponse = await axios.get(`http://localhost:2000/api/ongoing-contests?platforms=${platformsQuery}`);
          const ongoingContests = Array.isArray(ongoingResponse.data) ? ongoingResponse.data : [];
          contestData = [...contestData, ...ongoingContests.map(contest => ({ ...contest, status: "ongoing" }))];
          debugInfo.ongoing = ongoingContests.length;
        } catch (error) {
          console.error("Error fetching ongoing contests:", error);
        }
      }
      
      if (statusFilter === "All" || statusFilter === "Past") {
        try {
          const pastResponse = await axios.get(`http://localhost:2000/api/past-contests?platforms=${platformsQuery}`);
          const pastContests = Array.isArray(pastResponse.data) ? pastResponse.data : [];
          contestData = [...contestData, ...pastContests.map(contest => ({ ...contest, status: "past" }))];
          debugInfo.past = pastContests.length;
        } catch (error) {
          console.error("Error fetching past contests:", error);
        }
      }
      
      setDebugInfo({
        upcoming: statusFilter === "All" || statusFilter === "Upcoming" ? debugInfo.upcoming : 0,
        ongoing: statusFilter === "All" || statusFilter === "Ongoing" ? debugInfo.ongoing : 0,
        past: statusFilter === "All" || statusFilter === "Past" ? debugInfo.past : 0
      });
      
     
      if (contestData.length > 0) {
        contestData.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      
      setContests(contestData);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error fetching contests:", error);
      setError("Failed to load contests. Please try again later.");
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    window.alert("Syncing has been disabled. This button is for display only.");
    
  };

  const toggleBookmark = async (contestId, isBookmarked) => {
    try {
      const endpoint = isBookmarked ? "unbookmark" : "bookmark";
      await axios.post(`http://localhost:2000/api/contests/${contestId}/${endpoint}`);
      fetchContestsFromDB();
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      setError("Failed to update bookmark.");
    }
  };

  const getTimeRemaining = (date) => {
    const now = new Date();
    const contestDate = new Date(date);
    const diff = contestDate - now;
    
    if (diff <= 0) {
      const hoursSince = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return `about ${hoursSince} hours ago`;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `in ${days} days, ${hours} hours`;
    } else {
      return `in ${hours} hours`;
    }
  };

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00 ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  };

  // Show any API connectivity issues
  const renderApiStatus = () => {
    if (!apiStatus.dns) return null;
    
    const problemDomains = Object.entries(apiStatus.dns)
      .filter(([_, status]) => status.status === "error")
      .map(([domain]) => domain);
    
    if (problemDomains.length === 0) return null;
    
    return (
      <div className="api-status-warning">
        
      </div>
    );
  };

  if (loading && contests.length === 0) return <div className="loading">Loading contests...</div>;

  return (
    <div className="contest-tracker">
      <header className="header">
        <div className="logo">
          <Link to="/">Contest Tracker</Link>
        </div>
        <div className="header-actions">
          <Link to="/admin">Admin</Link>
          <button className="theme-toggle" onClick={toggleTheme}>
  {darkMode ? '☀️' : '🌙'}
</button>
        </div>
      </header>

      <main>
        <h1>Programming Contests</h1>
        
        {renderApiStatus()}
        
        {error && <div className="error-message">{error}</div>}
        
        
        
      
        <div className="debug-info" style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          Debug: Found {debugInfo.upcoming} upcoming, {debugInfo.ongoing} ongoing, {debugInfo.past} past contests.
        </div>
        
        <div className="filters-section">
          
          <div className="filter-group">
            <h3>Platforms</h3>
            <div className="platform-buttons">
              <button 
                className={selectedPlatforms.includes("Codeforces") ? "platform-btn active" : "platform-btn"}
                onClick={() => {
                  setSelectedPlatforms(prev => 
                    prev.includes("Codeforces") 
                      ? prev.filter(p => p !== "Codeforces") 
                      : [...prev, "Codeforces"]
                  );
                }}
              >
                Codeforces
              </button>
              <button 
                className={selectedPlatforms.includes("CodeChef") ? "platform-btn active" : "platform-btn"}
                onClick={() => {
                  setSelectedPlatforms(prev => 
                    prev.includes("CodeChef") 
                      ? prev.filter(p => p !== "CodeChef") 
                      : [...prev, "CodeChef"]
                  );
                }}
              >
                Codechef
              </button>
              <button 
                className={selectedPlatforms.includes("Leetcode") ? "platform-btn active" : "platform-btn"}
                onClick={() => {
                  setSelectedPlatforms(prev => 
                    prev.includes("Leetcode") 
                      ? prev.filter(p => p !== "Leetcode") 
                      : [...prev, "Leetcode"]
                  );
                }}
              >
                Leetcode
              </button>
            </div>
          </div>
          
          <div className="filter-group">
            <h3>Status</h3>
            <div className="status-buttons">
              <button 
                className={statusFilter === "All" ? "status-btn active" : "status-btn"}
                onClick={() => setStatusFilter("All")}
              >
                All
              </button>
              <button 
                className={statusFilter === "Upcoming" ? "status-btn active" : "status-btn"}
                onClick={() => setStatusFilter("Upcoming")}
              >
                Upcoming
              </button>
              <button 
                className={statusFilter === "Ongoing" ? "status-btn active" : "status-btn"}
                onClick={() => setStatusFilter("Ongoing")}
              >
                Ongoing
              </button>
              <button 
                className={statusFilter === "Past" ? "status-btn active" : "status-btn"}
                onClick={() => setStatusFilter("Past")}
              >
                Past
              </button>
            </div>
          </div>
        </div>

        <div className="contests-grid">
          {loading && contests.length > 0 && <div className="overlay-loading">Refreshing...</div>}
          
          {contests.length > 0 ? (
            contests.map(contest => (
              <div key={contest.id} className="contest-card">
                <div className="card-header">
                  <h2>{contest.name}</h2>
                  <button 
                    className="bookmark-btn"
                    onClick={() => toggleBookmark(contest.id, contest.bookmarked)}
                  >
                    {contest.bookmarked ? "★" : "☆"}
                  </button>
                </div>
                <div className="platform-tag">{contest.platform}</div>
                
                <div className="contest-details">
                  <div className="detail-row">
                    <span className="detail-label">Starts</span>
                    <span className="detail-value">{getFormattedDate(contest.date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ends</span>
                    <span className="detail-value">
                      {contest.duration ? getFormattedDate(new Date(new Date(contest.date).getTime() + contest.duration * 1000)) : "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Time Remaining</span>
                    <span className="detail-value">{getTimeRemaining(contest.date)}</span>
                  </div>
                </div>
                
                <div className="contest-status">
                  <span className={`status-tag ${contest.status}`}>{contest.status}</span>
                  <a href={contest.link} target="_blank" rel="noopener noreferrer" className="external-link">
                    <span className="link-icon">🔗</span>
                  </a>
                  
                  {contest.youtubeLink && (
                    <a href={contest.youtubeLink} target="_blank" rel="noopener noreferrer" className="youtube-link">
                      <span className="youtube-icon">📺</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-contests">
              {loading ? "Loading contests..." : "No contests found based on your filters."}
            </p>
          )}
        </div>
      </main>
      
      <footer>
        <p>Data sources: Codeforces API, Kontests API</p>
        {Object.keys(apiStatus).length > 0 && apiStatus.dns && (
          <p className="api-status">
            API Status: {Object.entries(apiStatus.dns).map(([domain, status]) => (
              <span key={domain} className={`status-indicator ${status.status}`}>
                {domain}: {status.status === "ok" ? "✓" : "✗"}
              </span>
            ))}
          </p>
        )}
      </footer>
    </div>
  );
};

export default ContestTracker;