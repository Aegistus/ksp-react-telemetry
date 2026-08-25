import { useState } from 'react'
import './App.css'
import WidgetPanel from './WidgetPanel.jsx'
import Hero from "./assets/hero.png"
import { useKspTelemetry } from './useKspTelemetry.js'

function App() {
  const { status, data } = useKspTelemetry({ source: 'demo'});

  if (status == 'connecting') return <p>Connecting...</p>;
  if (status == 'error') return <p>Something went wrong.</p>;
  if (!data) return <p>Waiting for the first data point...</p>;

  return (
    <div>
      <p>Mission phase: {data.phase}</p>
      <p>Altitude: {data.altitude.toFixed(0)} m</p>
      <p>Speed: {data.speed.toFixed(0)} m/s</p>
    </div>
  );

  // return (
  //   <>
  //     <WidgetPanel title="Velocity">
  //       <p></p>
  //     </WidgetPanel>
  //   </>
  // );
}

export default App