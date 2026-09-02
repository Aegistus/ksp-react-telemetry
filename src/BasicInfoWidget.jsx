import WidgetPanel from "./WidgetPanel";
import ValueReadout from "./ValueReadout";
import { formatTime } from "./App";
import { useEffect } from "react";

let maxStages = 0;

function BasicInfoWidget({currentData, status})
{
    // record the max stage based on current stage on first mount/status change
    useEffect(() => {
        maxStages = Number(String(currentData.stages)[0]);
    }, [status]);

    let currentStage = Number(String(currentData.stages)[0]);
    return(
        <WidgetPanel title= "Basic Info">
            <ValueReadout title="Vessel Name">
                { currentData.name }
            </ValueReadout>
            <ValueReadout title="MET">
                { formatTime(currentData.missionTime) }
            </ValueReadout>
            <ValueReadout title="UT">
                { formatTime(currentData.universalTime) }
            </ValueReadout>
            <ValueReadout title="Stages" units={" /" + maxStages}>
                { currentStage }
            </ValueReadout>
        </WidgetPanel>
    );
}
export default BasicInfoWidget;