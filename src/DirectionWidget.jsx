import WidgetPanel from "./WidgetPanel";
import ValueReadout from "./ValueReadout";
import { numberWithCommas } from "./App";
import { TELEMETRY_FIELDS } from "./useKspTelemetry";

function DirectionWidget({currentData})
{
    return(
        <WidgetPanel title="Direction">
          <ValueReadout title="Pitch" units= {TELEMETRY_FIELDS.pitch.unit}>
            { currentData.pitch.toFixed(2) }
          </ValueReadout>
          <ValueReadout title="Roll" units= {TELEMETRY_FIELDS.roll.unit}>
            { currentData.roll.toFixed(2) }
          </ValueReadout>
          <ValueReadout title="Yaw" units= {TELEMETRY_FIELDS.heading.unit}>
            { currentData.heading.toFixed(2) }
          </ValueReadout>
        </WidgetPanel>
    );
}
export default DirectionWidget;