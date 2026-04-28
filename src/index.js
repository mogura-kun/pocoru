import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Demo from './Demo';

const isDemo = window.location.search.includes("demo");
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode>{isDemo ? <Demo /> : <App />}</React.StrictMode>);
