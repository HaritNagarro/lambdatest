export const handler = (event:any, context:any) => {
    console.log("find event below")
    console.log(event?.Records[0]?.eventSource)
    console.log(event?.Records[0]?.Sns)
    console.log(event)
    return {
        statusCode:200,
        body: JSON.stringify({
            message : event
        })
    }
}