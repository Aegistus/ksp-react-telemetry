import { LineChart } from '@mui/x-charts/LineChart';
import './charts.css'

function LineGraph({xData = [], yData = [], interval = 1, xLabel="", yLabel = ""})
{
    const dataMax = yData && yData.length > 0 ? Math.max(...yData) : 1000;
    const axisMax = Math.ceil(dataMax / interval) * interval;
    return(
       <LineChart
            xAxis={[{ 
                data: xData,
                label: xLabel,
            }]}
            yAxis={[{ 
                min: 0,
                max: axisMax,
                width: 60,
                label: yLabel
            }]}
            series={[{
                curve: "linear",
                showMark: 'end',
                data: yData,
            }]}
            skipAnimation
            grid={{vertical: true, horizontal: true}}
            width={1000}
            height={300}
        />
    );
}
export default LineGraph;