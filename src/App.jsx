import { useState } from 'react'
import './App.css'
import WidgetPanel from './WidgetPanel.jsx'
import ValueReadout from './ValueReadout.jsx'
import { useKspTelemetry, TELEMETRY_FIELDS } from './useKspTelemetry.js'
import CesiumViewer from './CesiumViewer.jsx'
import LineGraph from './LineGraph.jsx'
import SourceButton from './SourceButton.jsx'

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
  stages: 0,
  missionTime: 0,
  universalTime: 0,
}

function formatTime(t) {
  const sign = t < 0 ? "-" : "+";
  const at = Math.abs(Math.round(t));
  const h = Math.floor(at / 3600).toString().padStart(2, "0");
  const m = Math.floor((at % 3600) / 60).toString().padStart(2, "0");
  const s = (at % 60).toString().padStart(2, "0");
  return `T${sign}${h}:${m}:${s}`;
}

function numberWithCommas(x) {
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
  // // if launch hasn't started, ignore all but one history snapshot
  // if (history.findLast(snapshot => snapshot.missionTime == 0))
  // {
  //   history = [history[0]];
  // }
  //console.log(history[0]);
  const longitude = data == null ? 0 : data.longitude;
  const latitude = data == null ? 0 : data.latitude;
  const altitude = data == null ? 0 : data.altitude;
  return (
    <div>
      <WidgetPanel>
        <SourceButton currentSource={source} setSource={setSource}/>
      </WidgetPanel>
      <p>Connection Status: {connectionStatus}</p>
      <WidgetPanel title= "Basic Info">
        <ValueReadout title="Vessel Name">
          { currentData.name }
        </ValueReadout>
        <ValueReadout title="MET"> 
          { formatTime(currentData.missionTime) }
        </ValueReadout>
      </WidgetPanel>
      <WidgetPanel title="Telemetry">
        <ValueReadout title="Altitude" units= {TELEMETRY_FIELDS.altitude.unit}>
          { numberWithCommas(currentData.altitude.toFixed(2)) }
        </ValueReadout>
      </WidgetPanel>
      <WidgetPanel title="Altitude (m)">
        <LineGraph dataSet={history} yDataKey={'altitude'} xLabel={"Time (s)"} yLabel={"Altitude (m)"} interval={5000}/>
      </WidgetPanel>
      {/* <CesiumViewer history={history} longitude={longitude} latitude={latitude} altitude={altitude}/> */}
      {/* <p>telemetry status: {status + " " + error}</p>
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
      <p>periapsis: {data.periapsis} m/s</p> */}
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