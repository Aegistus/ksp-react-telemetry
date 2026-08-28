
function ValueReadout({children, title = "", units = ""})
{
    return(
        <table className="parent-element">
            <thead>
                <tr>
                    <td className="readout-title">{title}</td>
                    <td className="readout-value">
                        <p> {children} </p>
                        <p className="units"> {units } </p>
                    </td>
                </tr>
            </thead>
        </table>
    );
}
export default ValueReadout