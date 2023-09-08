export function make_filled_image(width: number, height: number, fill: string) {
    let canvas = null
    if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = fill
        ctx.fillRect(0, 0, width / 2, height / 2)
        ctx.fillRect(width / 2, height / 2, width / 2, height / 2)
        return canvas
    } else {
        // console.log("doc is undefined")
        // throw new Error("no canvas image")
        // const pureimage = await import('pureimage')
        // console.log("pi is", pureimage)
        // canvas = pureimage.create(width,height)
        return {
            width:10,
            height:10,
            data:[0,0,0]
        }
    }
    // const canvas = document.createElement('canvas')
}
