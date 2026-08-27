import { useState } from 'react'
import './App.css'
import WidgetPanel from './WidgetPanel.jsx'
import Hero from "./assets/hero.png"
import { useKspTelemetry } from './useKspTelemetry.js'
import CesiumViewer from './CesiumViewer.jsx'


function App() {
  const { status, data, error } = useKspTelemetry({ source: 'demo'});

  if (status == 'connecting') return <p>Connecting...</p>;
  if (status == 'error') return <p>Something went wrong.</p>;
  if (!data) return <p>Waiting for the first data point...</p>;

  return (
    <div>
      <CesiumViewer longitude={data.longitude} latitude={data.latitude} altitude={data.altitude}/>
      <p>telemetry status: {status + " " + error}</p>
      <p>Mission phase: {data.phase}</p>
      <p>Altitude: {data.altitude} m</p>
      <p>Position: {data.position} m</p>
      <p>Latitude: {data.latitude} </p>
      <p>Longitude: {data.longitude} </p>
      <p>Pitch: {data.pitch}</p>
      <p>Yaw: {data.heading}</p>
      <p>Roll: {data.roll}</p>
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