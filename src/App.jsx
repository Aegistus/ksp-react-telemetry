import { useState } from 'react'
import './App.css'
import WidgetPanel from './WidgetPanel.jsx'
import Hero from "./assets/hero.png"

function App() {
 
  return (
    <>
      <WidgetPanel title="Velocity">
        <img src={Hero}></img>
      </WidgetPanel>
    </>
  );
}

export default App
