import { LineChart } from '@mui/x-charts/LineChart';
import './charts.css'


function LineGraph({dataSet={}, yDataKey="", interval = 1, xLabel="", yLabel = ""})
{
    const dataMax = dataSet.length > 0 ? Math.max(...dataSet.map((point) => point[yDataKey])) : 1000;
    const axisMax = Math.ceil(dataMax / interval) * interval;
    //const axisMax = 10000;
    return(
       <LineChart
            dataset={dataSet}
            xAxis={[{ 
                dataKey:"missionTime",
                label: xLabel,
            }]}
            yAxis={[{ 
                min: 0,
                max: axisMax,
                width: 60,
                label: yLabel
            }]}
            series={[{
                dataKey: yDataKey,
                curve: "linear",
                showMark: 'end',
            }]}
            skipAnimation
            grid={{vertical: true, horizontal: true}}
            width={1000}
            height={300}
        />
    );
}
export default LineGraph;