
function SourceButton({currentSource, setSource})
{
    const isChecked = currentSource == 'live';
    const changeSource = () => {
        if (currentSource == 'demo')
        {
            setSource('live');
        }
        else
        {
            setSource('demo');
        }
    }
    return(
    <table className="parent-element">
        <thead>
            <tr>
                <td>
                    <p className="button-label">DEMO</p>
                </td>
                <td>
                    <label className="switch">
                        <input type="checkbox" onChange={changeSource} checked={isChecked}/>
                        <span className="slider"/>
                    </label>
                </td>
                <td>
                    <p className="button-label">LIVE</p>
                </td>
            </tr>
        </thead>

    </table>
    );
}
export default SourceButton;