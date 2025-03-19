const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const dns = require('dns');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ovezeov:FwOll9LUSleet6IK@cluster0.y0oga.mongodb.net/Nodejs')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.log('MongoDB connection error:', error));

const Contest = require("./models/Contest");


const fetchWithRetry = async (url, options = {}, retries = 3) => {
  try {
    if (options.method === "POST") {
      return await axios.post(url, options.data, {
        headers: { 
          "User-Agent": "Mozilla/5.0",
          ...(options.headers || {})
        }
      });
    } else {
      return await axios.get(url, {
        headers: { 
          "User-Agent": "Mozilla/5.0",
          ...(options.headers || {})
        }
      });
    }
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying ${url}, ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

const fetchContests = async () => {
  let contests = [];
  let fetchErrors = [];

 
  try {
    const codeforces = await fetchWithRetry("https://codeforces.com/api/contest.list");
    if (codeforces.data.status === "OK") {
      const codeforcesContests = codeforces.data.result
        .filter(contest => contest.phase === "BEFORE" || contest.phase === "FINISHED")
        .map(contest => ({
          id: `cf_${contest.id}`,
          name: contest.name,
          date: new Date(contest.startTimeSeconds * 1000),
          link: `https://codeforces.com/contest/${contest.id}`,
          platform: "Codeforces",
          duration: contest.durationSeconds
        }));
      
      contests = contests.concat(codeforcesContests);
      console.log(`Fetched ${codeforcesContests.length} Codeforces contests`);
    }
  } catch (error) {
    console.error("Error fetching Codeforces contests:", error.message);
    fetchErrors.push(`Codeforces: ${error.message}`);
  }

  
  try {
    const codechef = await fetchWithRetry("https://kontests.net/api/v1/code_chef", {}, 1);
    if (codechef.data && Array.isArray(codechef.data)) {
      const codechefContests = codechef.data.map(contest => ({
        id: `cc_${contest.id || contest.url.split('/').pop()}`,
        name: contest.name,
        date: new Date(contest.start_time),
        link: contest.url,
        platform: "CodeChef",
        duration: contest.duration ? parseInt(contest.duration) : null
      }));
      
      contests = contests.concat(codechefContests);
      console.log(`Fetched ${codechefContests.length} CodeChef contests from kontests.net`);
    }
  } catch (error) {
    console.error("Error fetching CodeChef contests from kontests.net:", error.message);
    fetchErrors.push(`CodeChef (kontests.net): ${error.message}`);
    
    
    try {
   
      console.log("CodeChef fallback: Would attempt direct fetch here");
      
  
      
    } catch (fallbackError) {
      console.error("Error fetching CodeChef contests directly:", fallbackError.message);
      fetchErrors.push(`CodeChef (direct): ${fallbackError.message}`);
    }
  }

  
  try {
    const leetcode = await fetchWithRetry("https://kontests.net/api/v1/leet_code", {}, 1);
    if (leetcode.data && Array.isArray(leetcode.data)) {
      const leetcodeContests = leetcode.data.map(contest => ({
        id: `lc_${contest.id || contest.url.split('/').pop()}`,
        name: contest.name,
        date: new Date(contest.start_time),
        link: contest.url,
        platform: "Leetcode",
        duration: contest.duration ? parseInt(contest.duration) : null
      }));
      
      contests = contests.concat(leetcodeContests);
      console.log(`Fetched ${leetcodeContests.length} LeetCode contests from kontests.net`);
    }
  } catch (error) {
    console.error("Error fetching LeetCode contests from kontests.net:", error.message);
    fetchErrors.push(`LeetCode (kontests.net): ${error.message}`);
    
    // Fallback: Use LeetCode GraphQL API
    try {
      console.log("Attempting to fetch LeetCode contests directly...");
      const graphqlQuery = JSON.stringify({
        query: `
          query getContestList {
            contestList {
              title
              titleSlug
              startTime
              duration
              originStartTime
            }
          }
        `
      });
      
      const leetcodeDirect = await fetchWithRetry("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: graphqlQuery
      });
      
      if (leetcodeDirect.data && leetcodeDirect.data.data && leetcodeDirect.data.data.contestList) {
        const leetcodeContests = leetcodeDirect.data.data.contestList.map(contest => ({
          id: `lc_${contest.titleSlug}`,
          name: contest.title,
          date: new Date(contest.startTime * 1000),
          link: `https://leetcode.com/contest/${contest.titleSlug}`,
          platform: "Leetcode",
          duration: contest.duration
        }));
        
        contests = contests.concat(leetcodeContests);
        console.log(`Fetched ${leetcodeContests.length} LeetCode contests directly`);
      }
    } catch (fallbackError) {
      console.error("Error fetching LeetCode contests directly:", fallbackError.message);
      fetchErrors.push(`LeetCode (direct): ${fallbackError.message}`);
    }
  }

  console.log(`Total fetched contests: ${contests.length}`);
  if (fetchErrors.length > 0) {
    console.warn(`Fetch errors encountered: ${fetchErrors.length}`);
  }
  
  return contests;
};

const syncContests = async () => {
  const contests = await fetchContests();
  if (contests.length === 0) {
    console.warn("No contests fetched to sync.");
    return;
  }
  
  let syncedCount = 0;
  for (const contest of contests) {
    try {
      await Contest.findOneAndUpdate(
        { id: contest.id },
        contest,
        { upsert: true, new: true }
      );
      syncedCount++;
    } catch (error) {
      console.error(`Error syncing contest ${contest.id}:`, error.message);
    }
  }
  console.log(`Synced ${syncedCount} contests to MongoDB`);
};


app.get("/api/health", async (req, res) => {
  try {
   
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    
    const dnsChecks = {};
    
   
    const checkDNS = async (domain) => {
      return new Promise((resolve) => {
        dns.lookup(domain, (err) => {
          if (err) {
            resolve({ status: "error", message: err.message });
          } else {
            resolve({ status: "ok" });
          }
        });
      });
    };
    
   
    dnsChecks.kontests = await checkDNS('kontests.net');
    dnsChecks.codeforces = await checkDNS('codeforces.com');
    dnsChecks.leetcode = await checkDNS('leetcode.com');
    dnsChecks.codechef = await checkDNS('codechef.com');
    
    res.json({
      status: "ok",
      timestamp: new Date(),
      database: dbStatus,
      dns: dnsChecks,
      environment: {
        node: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});


app.get("/api/contests", async (req, res) => {
  try {
    const { platforms, status, sync } = req.query;
    const now = new Date();
    
    let query = {};
    
    if (platforms) {
      query.platform = { $in: platforms.split(",") };
    }
    
   
    if (status) {
      if (status === "upcoming") {
        query.date = { $gt: now };
      } else if (status === "ongoing") {
        query.$expr = {
          $and: [
            { $lte: ["$date", now] },
            { $gte: [{ $add: ["$date", { $multiply: ["$duration", 1000] }] }, now] }
          ]
        };
      } else if (status === "past") {
        query.$expr = {
          $lt: [{ $add: ["$date", { $multiply: ["$duration", 1000] }] }, now]
        };
      }
    } else {
      
      query.date = { $gte: new Date() };
    }
    
    const contests = await Contest.find(query).sort({ date: 1 });
    res.json(contests);
  } catch (error) {
    console.error("Error in /api/contests:", error);
    res.status(500).json({ error: "Error fetching contests" });
  }
});


app.get("/api/past-contests", async (req, res) => {
  try {
    const { platforms } = req.query;
    const now = new Date();
    
    let query = { 
      $expr: {
        $lt: [{ $add: ["$date", { $multiply: ["$duration", 1000] }] }, now]
      }
    };
    
    if (platforms) {
      query.platform = { $in: platforms.split(",") };
    }
    
    const pastContests = await Contest.find(query).sort({ date: -1 });
    res.json(pastContests);
  } catch (error) {
    console.error("Error in /api/past-contests:", error);
    res.status(500).json({ error: "Error fetching past contests" });
  }
});

// Get ongoing contests
app.get("/api/ongoing-contests", async (req, res) => {
  try {
    const { platforms } = req.query;
    const now = new Date();
    
    let query = {
      $expr: {
        $and: [
          { $lte: ["$date", now] },
          { $gte: [{ $add: ["$date", { $multiply: ["$duration", 1000] }] }, now] }
        ]
      }
    };
    
    if (platforms) {
      query.platform = { $in: platforms.split(",") };
    }
    
    const ongoingContests = await Contest.find(query).sort({ date: 1 });
    res.json(ongoingContests);
  } catch (error) {
    console.error("Error in /api/ongoing-contests:", error);
    res.status(500).json({ error: "Error fetching ongoing contests" });
  }
});

// Bookmark a contest
app.post("/api/contests/:id/bookmark", async (req, res) => {
  try {
    const contest = await Contest.findOneAndUpdate(
      { id: req.params.id },
      { bookmarked: true },
      { new: true }
    );
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: "Error bookmarking contest" });
  }
});

// Unbookmark a contest
app.post("/api/contests/:id/unbookmark", async (req, res) => {
  try {
    const contest = await Contest.findOneAndUpdate(
      { id: req.params.id },
      { bookmarked: false },
      { new: true }
    );
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: "Error unbookmarking contest" });
  }
});

// Attach a YouTube solution link
app.post("/api/contests/:id/solution", async (req, res) => {
  try {
    const { youtubeLink } = req.body;
    const contest = await Contest.findOneAndUpdate(
      { id: req.params.id },
      { youtubeLink },
      { new: true }
    );
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: "Error attaching solution link" });
  }
});

// Last sync timestamp endpoint
let lastSyncTime = null;
app.get("/api/last-sync", (req, res) => {
  res.json({ lastSync: lastSyncTime });
});

// Manual sync endpoint for admin use
app.post("/api/force-sync", async (req, res) => {
  try {
    await syncContests();
    lastSyncTime = new Date();
    res.json({ message: "Sync completed successfully", timestamp: lastSyncTime });
  } catch (error) {
    res.status(500).json({ error: "Error syncing contests", details: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

const port = process.env.PORT || 2000;
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  
 
  try {
    await syncContests();
    lastSyncTime = new Date();
  } catch (error) {
    console.error("Error syncing contests on startup:", error);
  }
});


module.exports = app;
