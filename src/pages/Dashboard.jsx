import React from "react";
import { Link } from "react-router-dom";
import "./dashboard.css";
import "font-awesome/css/font-awesome.min.css";

const tools = [
  { 
    title: "AI PowerPoint Generator", 
    desc: "Create professional slides from any topic using AI.", 
    icon: "fa-magic", 
    colorClass: "plus", 
    path: "/ai-generator" 
  },
  { 
    title: "PDF to PPT", 
    desc: "Convert PDF files into editable PowerPoint presentations.", 
    icon: "fa-file-pdf", 
    colorClass: "pdf", 
    path: "/pdftoppt" 
  },
  { 
    title: "Word to PPT", 
    desc: "Convert Word documents into engaging presentations.", 
    icon: "fa-file-word", 
    colorClass: "word", 
    path: "/wordtoppt" 
  },
  { 
    title: "Text to PPT", 
    desc: "Turn plain text files into styled slides quickly.", 
    icon: "fa-file-alt",   // use fa-file-alt instead of fa-file-lines for consistency
    colorClass: "text", 
    path: "/texttoppt" 
  },
  { 
    title: "Excel to PPT", 
    desc: "Convert Excel data into presentation-ready charts and tables.", 
    icon: "fa-file-excel", 
    colorClass: "excel", 
    path: "/exceltoppt" 
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <i className="fa fa-sliders" />
          <div>
            <h2>PPT Tools</h2>
            <p>Convert & Generate</p>
          </div>
        </div>
        <nav>
          <Link to="/dashboard" className="active"><i className="fa fa-home" /> Dashboard</Link>
          <Link to="/conversion"><i className="fa fa-history" /> Conversions</Link>
          <Link to="/settings"><i className="fa fa-cog" /> Settings</Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="content">
          <div className="header">
            <h1><span>✨ Welcome to</span> PPT Tools</h1>
            <p>Choose a tool below to get started</p>
          </div>

          <div className="tools-grid">
            {tools.map((tool, index) => (
              <Link key={index} to={tool.path} className="tool-card-link">
                <div className="tool-card">
                  <div className={`tool-icon ${tool.colorClass}`}>
                    <i className={`fa ${tool.icon}`} />
                  </div>
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.desc}</p>
                  <span className="tool-arrow"><i className="fa fa-arrow-right" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
