import { Viewer, Entity, PointGraphics } from 'resium'
import { Cartesian3 } from "cesium"
import { useKspTelemetry } from './useKspTelemetry';
import { Color } from 'cesium';

// default value for testing.
const capeCanaveralCoords = Cartesian3.fromDegrees(-80.59975911255418, 28.608391558118957, 100);
const pointGraphics = { pixelSize: 10 };

function CesiumViewer({history, longitude, latitude, altitude})
{
    const pastPointColor = new Color(1.0, .498, 0, .5); // CoAspire orange remapped from 0-1
    const pastPositions = history != null ? history.map(h => 
        <Entity key={h.seq} position={Cartesian3.fromDegrees(h.longitude, h.latitude, h.altitude)}>
            <PointGraphics pixelSize={2} color={pastPointColor}/>
        </Entity>
    ) : [];
    const position = Cartesian3.fromDegrees(longitude, latitude, altitude);
    return(
        <Viewer>
            {pastPositions}
            <Entity position={position}>
                <PointGraphics pixelSize={10}/>
            </Entity>
        </Viewer>
    );
}
export default CesiumViewer;