import { LineChart } from '@mui/x-charts/LineChart';
import WidgetPanel from './WidgetPanel';
import LineGraph from './LineGraph';

function ChartsWidget({history})
{
    return(
        <>
            <WidgetPanel title="Altitude (m)">
                <LineGraph dataSet={history} yDataKey={'altitude'} xLabel={"Time (s)"} yLabel={"Altitude (m)"} interval={5000}/>
            </WidgetPanel>
            <WidgetPanel title="Delta-V (m/s)">
                <LineGraph dataSet={history} yDataKey={'deltaV'} xLabel={"Time (s)"} yLabel={"Delta-V (m/s)"} interval={100}/>
            </WidgetPanel>
            <WidgetPanel title="Velocities (m/s)">
                <LineChart
                    dataset={history}
                    xAxis={[{
                        dataKey: "missionTime",
                        xLabel: "Time (s)"
                    }]}
                    yAxis={[{
                        width: 60,
                        yLabel: "velocity (m/s)",
                    }]}
                    series={[
                        {
                            dataKey: "speed",
                            curve: "linear",
                            showMark: "end",
                            color: "#EFCA08"
                        },
                        {
                            dataKey: "verticalSpeed",
                            curve: "linear",
                            showMark: "end",
                            color: "#6B7FD7"
                        },
                        {
                            dataKey: "horizontalSpeed",
                            curve: "linear",
                            showMark: "end",
                            color: "#588157"
                        }
                    ]}
                    skipAnimation
                    grid={{vertical: true, horizontal: true}}
                    width={1000}
                    height={300}
                />
            </WidgetPanel>

        </>
    );
}
export default ChartsWidget;