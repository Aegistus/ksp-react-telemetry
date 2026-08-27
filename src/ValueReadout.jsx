
function ValueReadout(props)
{
    return(
        <table className="parent-element">
            <thead>
                <tr>
                    <td className="readout-title">{props.title}</td>
                    <td className="readout-value">{props.children}</td>
                </tr>
            </thead>
        </table>
    );
}
export default ValueReadout