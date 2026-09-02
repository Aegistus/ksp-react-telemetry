import { useState } from 'react'
import './App.css'
import WidgetPanel from './WidgetPanel.jsx'
import { useKspTelemetry, TELEMETRY_FIELDS } from './useKspTelemetry.js'
import CesiumViewer from './CesiumViewer.jsx'
import SourceButton from './SourceButton.jsx'
import BasicInfoWidget from './BasicInfoWidget.jsx'
import TelemetryWidget from './TelemetryWidget.jsx'
import OrbitInfoWidget from './OrbitInfoWidget.jsx'
import DirectionWidget from './DirectionWidget.jsx'
import ChartsWidget from './ChartsWidget.jsx'

const defaultData = 
{
  altitude: 0,
  speed: 0,
  verticalSpeed: 0,
  horizontalSpeed: 0,
  gForce: 0,
  apoapsis: 0,
  periapsis: 0,
  phase: 0,
  latitude: 0,
  longitude: 0,
  direction: 0,
  pitch: 0,
  roll: 0,
  heading: 0,
  deltaV: 0,
  name: "N/A",
  stages: 5,
  missionTime: 0,
  universalTime: 0,
}

export function formatTime(t) {
  const sign = t < 0 ? "-" : "+";
  const at = Math.abs(Math.round(t));
  const h = Math.floor(at / 3600).toString().padStart(2, "0");
  const m = Math.floor((at % 3600) / 60).toString().padStart(2, "0");
  const s = (at % 60).toString().padStart(2, "0");
  return `T${sign}${h}:${m}:${s}`;
}

export function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

function App() {
  let [source, setSource] = useState('live');
  let { status, data, history, error } = useKspTelemetry({ source: source, demoSpeed: .5});
  let connectionStatus = "Connected"
  let currentData = data;

  if (status == 'connecting') 
  {
    connectionStatus = "Connecting...";
    currentData = defaultData;
  }
  if (status == 'error') 
  {
    connectionStatus = "Something went wrong.";
    currentData = defaultData;
  }
  if (!data) 
  {
    connectionStatus = "Waiting for the first data point...";
    currentData = defaultData;
  }
  const longitude = data == null ? 0 : data.longitude;
  const latitude = data == null ? 0 : data.latitude;
  const altitude = data == null ? 0 : data.altitude;
  return (
    <div>
      <WidgetPanel>
        <SourceButton currentSource={source} setSource={setSource}/>
      </WidgetPanel>
      <p>Connection Status: {connectionStatus}</p>
      <table>
        <thead>
          <tr>
            <td className="main-table">
              <BasicInfoWidget currentData={currentData} status={status}/>
              <DirectionWidget currentData={currentData}/>
            </td>
            <td className="main-table">
              <OrbitInfoWidget currentData={currentData}/>
              <TelemetryWidget currentData={currentData}/>
            </td>
            <td className="main-table">
              <ChartsWidget history={history}/>
            </td>
          </tr>
        </thead>
      </table>
      <CesiumViewer history={history} longitude={longitude} latitude={latitude} altitude={altitude}/>
    </div>
  );

}

export default App