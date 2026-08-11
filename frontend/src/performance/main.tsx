import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import '../index.css';
import { PerformanceHarness } from './PerformanceHarness';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode><PerformanceHarness /></StrictMode>,
);
