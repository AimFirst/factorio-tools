import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { getToolById } from './tools/registry';

const NullComponent = () => null;

export function App() {
  const [activeToolId, setActiveToolId] = useState('factory-planner');

  useEffect(() => {
    const handleSwitchTool = (e: Event) => {
      const customEvent = e as CustomEvent<{ toolId: string }>;
      if (customEvent.detail?.toolId) {
        setActiveToolId(customEvent.detail.toolId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('switch-tool', handleSwitchTool);
    return () => window.removeEventListener('switch-tool', handleSwitchTool);
  }, []);

  const activeTool = getToolById(activeToolId);
  const ToolComponent = activeTool?.component || NullComponent;

  return (
    <AppShell activeToolId={activeToolId} onSelectTool={setActiveToolId}>
      <ToolComponent />
    </AppShell>
  );
}

export default App;
