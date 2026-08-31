import WidgetPanel from "./WidgetPanel";
import ValueReadout from "./ValueReadout";
import { formatTime } from "./App";
import { TELEMETRY_FIELDS } from "./useKspTelemetry";

function BasicInfoWidget({currentData})
{
    return(
        <WidgetPanel title= "Basic Info">
            <ValueReadout title="Vessel Name">
                { currentData.name }
            </ValueReadout>
            <ValueReadout title="MET">
                { formatTime(currentData.missionTime) }
            </ValueReadout>
            <ValueReadout title="UT">
                { currentData.universalTime }
            </ValueReadout>
            <ValueReadout title="Stages">
                { currentData.stages }
            </ValueReadout>
        </WidgetPanel>
    );
}
export default BasicInfoWidget;