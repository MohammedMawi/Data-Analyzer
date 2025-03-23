import React from 'react';
import '../CSS/header.css';

export default function Header() {
    return (
        <header className="header">
            {/* Left side: Project name */}
            <div className="left">
                <span className="proj">Data Analyzer</span>
            </div>

            {/* Right side: GitHub Link */}
            <div className="right">
                <a href="https://github.com/MohammedMawi/Data-Analyzer/tree/master" target="_blank" rel="noopener noreferrer">
                    <img className="git" src="/images/github2.png" alt="GitHub" />
                </a>
            </div>
        </header>
    );
}
