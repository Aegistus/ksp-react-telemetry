import { Viewer, Entity, PointGraphics, PolylineGraphics } from 'resium'
import { Cartesian3, CallbackProperty } from "cesium"
import { useKspTelemetry } from './useKspTelemetry';
import { Color } from 'cesium';
import { useRef, useMemo } from 'react';

// default value for testing.
const capeCanaveralCoords = Cartesian3.fromDegrees(-80.59975911255418, 28.608391558118957, 100);
const nationalCathedral = Cartesian3.fromDegrees(38.93060227607134, -77.07069684780762, 100); // don't ask me why I chose the national cathedral, it was just the first place on Google Maps.
const pointGraphics = { pixelSize: 10 };
const testPoints = [ capeCanaveralCoords, nationalCathedral]

const PAST_POINT_COLOR = new Color(1.0, 0.498, 0, 1); // CoAspire orange, remapped from 0-1

function CesiumViewer({history, longitude, latitude, altitude})
{
    const pastPositionCache = useRef(new Map());
    const trailPositions = useMemo(() => 
    {
        if (!history)
        {
            return [];
        }
        const nextCache = new Map();
        const positions = history.map((h) => 
        {
            let pos = pastPositionCache.current.get(h.seq);
            if (!pos)
            {
                pos = Cartesian3.fromDegrees(h.longitude, h.latitude, h.altitude);
            }
            nextCache.set(h.seq, pos);
            return pos;
        });
        pastPositionCache.current = nextCache;
        return positions;
    }, [history]);

    const position = useMemo(
        () => Cartesian3.fromDegrees(longitude, latitude, altitude),
        [longitude, latitude, altitude]
    );

    /*
        Create a callback property for the trail positions that gets passed to the PolylineGraphics.
         This prevents flickering because the callback property updates synchronously and means Cesium
        doesn't tear down the old line to rebuild a new one every frame.
    */
    const trailPositionsRef = useRef([]);
    trailPositionsRef.current = trailPositions;
    const positionsProperty = useRef(
        new CallbackProperty(() => trailPositionsRef.current, false)
    ).current;

    return(
        <Viewer>
            {trailPositions.length >= 2 && (
                <Entity>
                    <PolylineGraphics positions={positionsProperty} width={2} material={PAST_POINT_COLOR}/>
                </Entity>
            )}
            <Entity position={position}>
                <PointGraphics pixelSize={10}/>
            </Entity>
        </Viewer>
    );
}
export default CesiumViewer;