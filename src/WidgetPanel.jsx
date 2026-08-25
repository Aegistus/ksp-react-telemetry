
function WidgetPanel(props)
{
    return(
        <div className="widget-panel">
            <h1>{props.title}</h1>
            <div>{props.children}</div>
        </div>
    );
}
export default WidgetPanel