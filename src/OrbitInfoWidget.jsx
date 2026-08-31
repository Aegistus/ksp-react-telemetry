import { numberWithCommas } from "./App";
import { TELEMETRY_FIELDS } from "./useKspTelemetry";
import ValueReadout from "./ValueReadout";
import WidgetPanel from "./WidgetPanel";

function OrbitInfoWidget({currentData})
{
    return(
        <WidgetPanel title="Orbit">
          <ValueReadout title="Apoapsis" units={TELEMETRY_FIELDS.apoapsis.unit}>
            { numberWithCommas(currentData.apoapsis.toFixed(2))}
          </ValueReadout>
          <ValueReadout title="Periapsis" units={TELEMETRY_FIELDS.apoapsis.unit}>
            { numberWithCommas(currentData.periapsis.toFixed(2))}
          </ValueReadout>
        </WidgetPanel>
    );
}
export default OrbitInfoWidget;