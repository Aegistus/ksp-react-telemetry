import { LineChart } from '@mui/x-charts/LineChart';
import './charts.css'

function LineGraph(props)
{
    return(
       <LineChart
            xAxis={[{ data: props.xData}]}
            series={[{ curve: "linear", data: props.yData}]}
            skipAnimation
            width={1000}
            height={300}
        />
    );
}
export default LineGraph;