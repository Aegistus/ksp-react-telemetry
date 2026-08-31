import WidgetPanel from "./WidgetPanel";
import ValueReadout from "./ValueReadout";
import { numberWithCommas } from "./App";
import { TELEMETRY_FIELDS } from "./useKspTelemetry";

function TelemetryWidget({currentData})
{
    return(
        <WidgetPanel title="Telemetry">
          <ValueReadout title="Altitude" units= {TELEMETRY_FIELDS.altitude.unit}>
            { numberWithCommas(currentData.altitude.toFixed(2)) }
          </ValueReadout>
          <ValueReadout title="Speed" units={TELEMETRY_FIELDS.speed.unit}>
            { numberWithCommas(currentData.speed.toFixed(2)) }
          </ValueReadout>
          <ValueReadout title="Vertical Speed" units={TELEMETRY_FIELDS.verticalSpeed.unit}>
            { numberWithCommas(currentData.verticalSpeed.toFixed(2)) }
          </ValueReadout>
          <ValueReadout title="Horizontal Speed" units={TELEMETRY_FIELDS.horizontalSpeed.unit}>
            { numberWithCommas(currentData.horizontalSpeed.toFixed(2)) }
          </ValueReadout>
          <ValueReadout title="G-Force" units={TELEMETRY_FIELDS.gForce.unit}>
            { currentData.gForce.toFixed(1) }
          </ValueReadout>
          <ValueReadout title="Latitude" units={TELEMETRY_FIELDS.latitude.unit}>
            { currentData.latitude.toFixed(4) }
          </ValueReadout>
          <ValueReadout title="Longitude" units={TELEMETRY_FIELDS.longitude.unit}>
            { currentData.longitude.toFixed(4) }
          </ValueReadout>
          <ValueReadout title="Remaining Delta-V" units={TELEMETRY_FIELDS.deltaV.unit}>
            { currentData.deltaV.toFixed(1) }
          </ValueReadout>
        </WidgetPanel>
    );
}
export default TelemetryWidget;