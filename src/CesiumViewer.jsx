import { Viewer, Entity, PointGraphics } from 'resium'
import { Cartesian3 } from "cesium"
import { useKspTelemetry } from './useKspTelemetry';

// default value for testing.
const capeCanaveralCoords = Cartesian3.fromDegrees(-80.59975911255418, 28.608391558118957, 100);
const pointGraphics = { pixelSize: 10 };

function CesiumViewer({longitude, latitude, altitude})
{
    const position = Cartesian3.fromDegrees(longitude, latitude, altitude);    
    return(
        <Viewer>
            <Entity position={position}>
                <PointGraphics pixelSize={10}/>
            </Entity>
        </Viewer>
    );
}
export default CesiumViewer;