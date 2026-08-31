import { LineChart } from '@mui/x-charts/LineChart';
import WidgetPanel from './WidgetPanel';
import LineGraph from './LineGraph';
import { ChartsContainer, LinePlot, ChartsReferenceLine, ChartsXAxis, ChartsYAxis, ChartsGrid, lineClasses } from '@mui/x-charts';

function ChartsWidget({history})
{
    return(
        <>
            <WidgetPanel title="Altitude (m)">
                {/* <LineGraph dataSet={history} yDataKey={'altitude'} xLabel={"Time (s)"} yLabel={"Altitude (m)"} interval={5000}/> */}
                <ChartsContainer
                    dataset={history}
                    xAxis={[{ 
                        dataKey:"missionTime",
                        label: "Time (s)",
                    }]}
                    yAxis={[{ 
                        min: 0,
                        width: 60,
                        label: "Altitude (m)"
                    }]}
                    series={[{
                        dataKey: "altitude",
                        type: "line",
                        curve: "linear",
                        showMark: 'end',
                        color: "#FF7A00"
                    }]}
                    skipAnimation
                    grid={{vertical: true, horizontal: true}}
                    width={1000}
                    height={300}
                >
                    <LinePlot/>
                    <ChartsReferenceLine
                        y={140000}
                        label="Karman Line"
                        lineStyle={{stroke:'white', strokeDasharray: "10 5"}}
                        labelStyle={{fill: 'white'}}
                    />
                    <ChartsReferenceLine
                        y={20000}
                        label="Stratosphere"
                        lineStyle={{stroke:'white', strokeDasharray: "10 5"}}
                        labelStyle={{fill: 'white'}}
                    />
                    <ChartsReferenceLine
                        y={50000}
                        label="Mesosphere"
                        lineStyle={{stroke:'white', strokeDasharray: "10 5"}}
                        labelStyle={{fill: 'white'}}
                    />
                    <ChartsReferenceLine
                        y={85000}
                        label="Thermosphere"
                        lineStyle={{stroke:'white', strokeDasharray: "10 5"}}
                        labelStyle={{fill: 'white'}}
                    />
                    <ChartsReferenceLine
                        y={600000}
                        label="Exosphere"
                        lineStyle={{stroke:'white', strokeDasharray: "10 5"}}
                        labelStyle={{fill: 'white'}}
                    />
                    <ChartsReferenceLine
                        y={100000}
                        label="Karman Line"
                        lineStyle={{stroke:'orange', strokeDasharray: "10 5"}}
                        labelStyle={{fill: 'orange'}}
                    />
                    <ChartsXAxis/>
                    <ChartsYAxis/>
                    <ChartsGrid horizontal={true} vertical={true}/>
                </ChartsContainer>
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
                            label: "Total Velocity",
                            curve: "linear",
                            showMark: "end",
                            color: "#EFCA08"
                        },
                        {
                            dataKey: "verticalSpeed",
                            label: "Vertical Velocity",
                            curve: "linear",
                            showMark: "end",
                            color: "#6B7FD7"
                        },
                        {
                            dataKey: "horizontalSpeed",
                            label: "Horizontal Velocity",
                            curve: "linear",
                            showMark: "end",
                            color: "#588157"
                        }
                    ]}
                    skipAnimation
                    grid={{vertical: true, horizontal: true}}
                    width={1000}
                    height={300}
                    sx={{
                        '& .MuiChartsLegend-root':
                        {
                            color: "#FFFFFF"
                        },
                    }}
                />
            </WidgetPanel>
        </>
    );
}
export default ChartsWidget;