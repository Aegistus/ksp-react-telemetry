
function WidgetPanel(props)
{
    if (props.title == null)
    {
        return(
            <div className="widget-panel">
                {props.children}
            </div>
        );
    }
    return(
        <div className="widget-panel">
            <h1 className="widget-title">{props.title}</h1>
            {props.children}
        </div>
    );

}
export default WidgetPanel