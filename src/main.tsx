import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { HubDataProvider } from './data/HubData';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <HubDataProvider>
    <App />
  </HubDataProvider>
);
