import { Viewer, Entity } from 'resium'
import { Cartesian3 } from "cesium"

const position = Cartesian3.fromDegrees(-74.07, 40.71, 100);
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