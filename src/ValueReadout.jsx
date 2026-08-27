
function ValueReadout(props)
{
    return(
        <table className="parent-element">
            <thead>
                <tr>
                    <td className="readout-title">{props.title}</td>
                    <td className="readout-value">
                        <p> {props.children} </p>
                        <p className="units"> {props.units } </p>
                    </td>
                </tr>
            </thead>
        </table>
    );
}
export default ValueReadout