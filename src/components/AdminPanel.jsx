import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState("");
  const [selectedContestDetails, setSelectedContestDetails] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentSolution, setCurrentSolution] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Solution playlist links
  const [solutionLinks, setSolutionLinks] = useState({
    leetcode: "https://www.youtube.com/playlist?list=PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr",
    codeforces: "https://www.youtube.com/playlist?list=PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB",
    codechef: "https://www.youtube.com/playlist?list=PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr"
  });

    useEffect(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.body.classList.add('dark-mode');
      }
    }, []); 

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

  const navigateToAddContest = () => {
    navigate("/"); 
  };

  const fetchContests = async () => {
    try {
      const response = await axios.get("http://localhost:2000/api/past-contests");
      setContests(response.data);
    } catch (error) {
      setError("Failed to load past contests");
    }
  };

  const handleContestSelect = async (contestId) => {
    setSelectedContest(contestId);
    
    if (contestId) {
      try {
        
        const selectedContest = contests.find(contest => contest.id === contestId);
        if (selectedContest) {
          setSelectedContestDetails(selectedContest);
        }
        
        
        const response = await axios.get(`http://localhost:2000/api/contests/${contestId}`);
        setSelectedContestDetails(response.data);
        
        
        if (response.data.solutionLink) {
          setYoutubeLink(response.data.solutionLink);
          setCurrentSolution(response.data.solutionLink);
        } else {
          setYoutubeLink("");
          setCurrentSolution(null);
        }
      } catch (error) {
        console.error("Error fetching contest details:", error);
        setError("Failed to load contest details");
      }
    } else {
      setSelectedContestDetails(null);
      setYoutubeLink("");
      setCurrentSolution(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContest || !youtubeLink) {
      setError("Please select a contest and provide a YouTube link.");
      return;
    }

    try {
      await axios.post(`http://localhost:2000/api/contests/${selectedContest}/solution`, { youtubeLink });
      setMessage("Solution link added successfully!");
      setError("");
      
      
      setCurrentSolution(youtubeLink);
      
      
      const contestName = selectedContestDetails ? selectedContestDetails.name : 
                          contests.find(c => c.id === selectedContest)?.name || "Selected Contest";
      
      const platform = selectedContestDetails ? selectedContestDetails.platform : 
                       contests.find(c => c.id === selectedContest)?.platform || "";
      
      
      setSelectedContestDetails({
        ...selectedContestDetails,
        id: selectedContest,
        name: contestName,
        platform: platform,
        solutionLink: youtubeLink
      });
      
      
      fetchContests();
    } catch (error) {
      console.error("Error submitting solution:", error);
      setError("Failed to add solution link");
    }
  };

  
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  return (
    <>
      <div className={`admin-panel ${darkMode ? 'dark-mode' : ''}`}>
        <div className="header-controls">
          <button 
            className="nav-button" 
            onClick={navigateToAddContest}
          >
            ← Back to Add Contest
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
  {darkMode ? '☀️' : '🌙'}
</button>
        </div>
        
        <h1>Admin Panel - Attach YouTube Solution</h1>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <label>Select Contest:</label>
          <select 
            value={selectedContest} 
            onChange={(e) => handleContestSelect(e.target.value)}
          >
            <option value="">-- Select a Contest --</option>
            {contests.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.name} ({contest.platform})
              </option>
            ))}
          </select>

          <label>YouTube Solution Link:</label>
          <input
            type="text"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            placeholder="Enter YouTube link (e.g., from Leetcode PCDs, Codeforces PCDs, Codechef PCDs)"
          />

          <button type="submit">Attach Solution</button>
        </form>
        
        
        {(currentSolution || (selectedContestDetails && selectedContestDetails.solutionLink)) && (
          <div className="contest-solution">
            <h2>Contest Solution</h2>
            <div className="contest-details">
              <h3>{selectedContestDetails?.name || "Selected Contest"}</h3>
              {selectedContestDetails?.platform && <p>Platform: {selectedContestDetails.platform}</p>}
              
              <div className="solution-video">
                <h4>Solution Video</h4>
                <div className="video-container">
                  <iframe
                    width="560"
                    height="315"
                    src={getYouTubeEmbedUrl(currentSolution || selectedContestDetails?.solutionLink)}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <p>
                  <a 
                    href={currentSolution || selectedContestDetails?.solutionLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Open video in YouTube
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Solution Playlist Links Section */}
        <div className="solution-playlists">
          <h2>Solution Playlist Links</h2>
          
          <div className="playlist-links">
            <div className="playlist-item">
              <h3>LeetCode Solutions</h3>
              <a href={solutionLinks.leetcode} target="_blank" rel="noopener noreferrer">
                View LeetCode Solutions Playlist
              </a>
            </div>
            
            <div className="playlist-item">
              <h3>CodeForces Solutions</h3>
              <a href={solutionLinks.codeforces} target="_blank" rel="noopener noreferrer">
                View CodeForces Solutions Playlist
              </a>
            </div>
            
            <div className="playlist-item">
              <h3>CodeChef Solutions</h3>
              <a href={solutionLinks.codechef} target="_blank" rel="noopener noreferrer">
                View CodeChef Solutions Playlist
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;