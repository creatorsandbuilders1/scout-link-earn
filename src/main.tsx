import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { WalletProvider } from "./contexts/WalletContext";
import { ContractProvider } from "./contexts/ContractContext";

console.log('[MAIN] Starting REFERYDO! application...');
console.log('[MAIN] Environment:', import.meta.env.MODE);

try {
  console.log('[MAIN] Creating root element...');
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error('[MAIN] Root element not found!');
    throw new Error('Root element not found');
  }
  
  console.log('[MAIN] Root element found, rendering app...');
  
  createRoot(rootElement).render(
    <WalletProvider>
      <ContractProvider>
        <App />
      </ContractProvider>
    </WalletProvider>
  );
  
  console.log('[MAIN] App rendered successfully!');
} catch (error) {
  console.error('[MAIN] Fatal error during initialization:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">Application Error</h1>
      <p>Failed to initialize REFERYDO!</p>
      <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error}</pre>
      <p>Check the console for more details.</p>
    </div>
  `;
}
