import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom'; 
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // BrowserRouter is a component that wraps the entire application and provides the routing functionality to the application.
  <BrowserRouter> 
    <App />
  </BrowserRouter>
);

