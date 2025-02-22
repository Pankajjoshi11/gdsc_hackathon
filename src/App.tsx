import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import NewPage from "./components/NewPage"; // The new page you are adding
import MainChat from "./components/MainChat";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainChat />} />
        <Route path="/new-page" element={<NewPage />} />
      </Routes>
    </Router>
  );
};

export default App;
