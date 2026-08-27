import { Viewer, Entity } from 'resium'
import { Cartesian3 } from "cesium"

const position = Cartesian3.fromDegrees(-80.59975911255418, 28.608391558118957, 100);
const pointGraphics = { pixelSize: 10 };

function CesiumViewer()
{
    return(
        <Viewer>
            <Entity position={position} point={pointGraphics} />
        </Viewer>
    );
}
export default CesiumViewer;