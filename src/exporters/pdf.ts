import {GlobalState} from "../models/state";
import {canvas_to_blob, forceDownloadBlob} from "josh_web_util";
import {stateToCanvas} from "./png";
import {PageClass} from "../models/om";
import {
    PDFDocument,
    pushGraphicsState,
    popGraphicsState,
    scale,
    translate,
    rgb,
} from "pdf-lib";
import {lookup_dpi, Unit} from "../models/unit";
import {Point} from "josh_js_util";

function hex_to_pdfrgbf(fill: string) {
    if (fill.startsWith('#')) fill = fill.substring(1)
    let r = parseInt(fill.substring(0, 2), 16)
    let g = parseInt(fill.substring(2, 4), 16)
    let b = parseInt(fill.substring(4, 6), 16)
    return rgb(r / 255, g / 255, b / 255)
}

function render_pdf_page(doc: PDFDocument, page1: PageClass, unit:Unit) {
    let size = page1.getPropValue('size')
    let dpi = lookup_dpi(unit)
    let pdfPage = doc.addPage([size.w*dpi,size.h*dpi])
    pdfPage.pushOperators(
        pushGraphicsState(),
        scale(1,-1),
        translate(0,-pdfPage.getHeight())
    )
    page1.getListProp('children').forEach(ch => {
        if(ch.def.name === 'rect') {
            let bounds = ch.getPropValue('bounds')
            let fill = ch.getPropValue('fill')
            let draw_bounds = bounds.scale(dpi)
            pdfPage.drawRectangle({
                x:draw_bounds.x,
                y:draw_bounds.y,
                width:draw_bounds.w,
                height:draw_bounds.h,
                color: hex_to_pdfrgbf(fill),
            })
        }
        if(ch.def.name === 'circle') {
            let center = ch.getPropValue('center') as Point
            let radius = ch.getPropValue('radius') as number
            let fill = ch.getPropValue('fill') as string
            pdfPage.drawCircle({
                x: center.x*dpi,
                y: center.y*dpi,
                size: radius*dpi,
                color: hex_to_pdfrgbf(fill)
            })
        }
    })

    pdfPage.pushOperators(popGraphicsState())
}

export async function exportPDF(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    const doc = state.getCurrentDocument()
    const pdfDoc = await PDFDocument.create()
    doc.getListProp('pages').forEach(page => render_pdf_page(pdfDoc,page as PageClass, doc.getPropValue('unit') as Unit))
    let blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' })
    forceDownloadBlob('test.pdf',blob)
}
