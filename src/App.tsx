import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { getToolById } from './tools/registry';

const NullComponent = () => null;

export function App() {
  const [activeToolId, setActiveToolId] = useState('factory-planner');

  const activeTool = getToolById(activeToolId);
  const ToolComponent = activeTool?.component || NullComponent;

  return (
    <AppShell activeToolId={activeToolId} onSelectTool={setActiveToolId}>
      <ToolComponent />
    </AppShell>
  );
}

export default App;
