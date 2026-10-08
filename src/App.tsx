import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { getToolById } from './tools/registry';

export function App() {
  const [activeToolId, setActiveToolId] = useState('station-allocator');

  const activeTool = getToolById(activeToolId);
  const ToolComponent = activeTool?.component || (() => null);

  return (
    <AppShell activeToolId={activeToolId} onSelectTool={setActiveToolId}>
      <ToolComponent />
    </AppShell>
  );
}

export default App;
