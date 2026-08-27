import { Viewer, Entity, PointGraphics } from 'resium'
import { Cartesian3 } from "cesium"
import { useKspTelemetry } from './useKspTelemetry';

const capeCanaveralCoords = Cartesian3.fromDegrees(-80.59975911255418, 28.608391558118957, 100);
const pointGraphics = { pixelSize: 10 };

function CesiumViewer(props)
{
    const position = Cartesian3.fromDegrees(props.longitude, props.latitude, props.altitude);    
    return(
        <Viewer>
            <Entity position={position}>
                <PointGraphics pixelSize={10}/>
            </Entity>
        </Viewer>
    );
}
export default CesiumViewer;