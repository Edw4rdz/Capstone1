import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AIGenerator from "./pages/AIGenerator";
import PDFToPPT from "./pages/PDFtoPPT";
import TextToPPT from "./pages/TextToPPT";
import WordToPPT from "./pages/WordToPPT";
import ExcelToPPT from "./pages/ExcelToPPT";
import Conversions from "./pages/Conversions";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-generator" element={<AIGenerator />} />
        <Route path="/pdftoppt" element={<PDFToPPT />} />
        <Route path="/texttoppt" element={<TextToPPT />} />
        <Route path="/wordtoppt" element={<WordToPPT />} />
        <Route path="/exceltoppt" element={<ExcelToPPT />} />
        <Route path="/conversion" element={<Conversions />} />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}
