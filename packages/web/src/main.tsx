import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles/theme.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');
createRoot(rootEl).render(<App />);
