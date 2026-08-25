import { useState } from 'react'
import './App.css'
import WidgetPanel from './WidgetPanel.jsx'
import Hero from "./assets/hero.png"
import { useKspTelemetry } from './useKspTelemetry.js'

function App() {
  const { status, data, error } = useKspTelemetry({ source: 'live'});

  if (status == 'connecting') return <p>Connecting...</p>;
  if (status == 'error') return <p>Something went wrong.</p>;
  if (!data) return <p>Waiting for the first data point...</p>;

  console.log(data.speed);
  return (
    <div>
      <p>telemetry status: {status + " " + error}</p>
      <p>Mission phase: {data.phase}</p>
      <p>Altitude: {data.altitude} m</p>
      <p>Speed: {data.speed} m/s</p>
      <p>Vertical Speed: {data.verticalSpeed} m/s</p>
      <p>Horizontal Speed: {data.horizontalSpeed} m/s</p>
      <p>gForce: {data.gForce} m/s</p>
      <p>apoapsis: {data.apoapsis} m/s</p>
      <p>periapsis: {data.periapsis} m/s</p>
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