
function WidgetPanel({title = "", children})
{
    if (title == null || title === "")
    {
        return(
            <div className="widget-panel">
                {children}
            </div>
        );
    }
    return(
        <div className="widget-panel">
            <h1 className="widget-title">{title}</h1>
            {children}
        </div>
    );

}
export default WidgetPanel