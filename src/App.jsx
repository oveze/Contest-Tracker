import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ContestTracker from "./components/ContestTracker";
import AdminPanel from "./components/AdminPanel";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ContestTracker />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
};

export default App;