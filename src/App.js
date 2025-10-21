import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EditPreview from './pages/EditPreview';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AIGenerator from "./pages/AIGenerator";
import PDFToPPT from "./pages/PDFtoPPT";
import TextToPPT from "./pages/TextToPPT";
import WordToPPT from "./pages/WordToPPT";
import ExcelToPPT from "./pages/ExcelToPPT";
import Conversions from "./pages/Conversions";
import Logout from "./pages/Logout";
import UploadTemplate from "./pages/UploadTemplate";
import Settings from "./pages/Settings"; 

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-generator" element={<AIGenerator />} />
        <Route path="/pdftoppt" element={<PDFToPPT />} />
        <Route path="/texttoppt" element={<TextToPPT />} />
        <Route path="/wordtoppt" element={<WordToPPT />} />
        <Route path="/exceltoppt" element={<ExcelToPPT />} />
        <Route path="/conversion" element={<Conversions />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/ai-generator" element={<AIGenerator />} />
        <Route path="/edit-preview" element={<EditPreview />} />
        <Route path="/uploadTemplate" element={<UploadTemplate />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}
