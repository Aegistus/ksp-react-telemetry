import { LineChart } from '@mui/x-charts/LineChart';
import './charts.css'

function LineGraph(props)
{

    return(
       <LineChart
            xAxis={[{ data: props.xData}]}
            series={[{data: props.yData}]}
            height={300}
        />
    );
}
export default LineGraph;