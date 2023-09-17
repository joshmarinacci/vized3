import {Point} from "josh_js_util"
import {forceDownloadBlob} from "josh_web_util"
import {
    PDFDocument,
    popGraphicsState,
    pushGraphicsState,
    rgb,
    scale,
    translate,
} from "pdf-lib"

import {CircleClass} from "../models/circle"
import {PageClass} from "../models/page"
import {PathShapeClass} from "../models/pathshape"
import {RectClass} from "../models/rect"
import {GlobalState} from "../models/state"
import {lookup_pdf_dpi, Unit} from "../models/unit"

function hex_to_pdfrgbf(fill: string) {
    if (fill.startsWith('#')) fill = fill.substring(1)
    const r = parseInt(fill.substring(0, 2), 16)
    const g = parseInt(fill.substring(2, 4), 16)
    const b = parseInt(fill.substring(4, 6), 16)
    return rgb(r / 255, g / 255, b / 255)
}

function render_pdf_page(doc: PDFDocument, page1: PageClass, unit:Unit) {
    const size = page1.getPropValue('size')
    const dpi = lookup_pdf_dpi(unit)
    const pdfPage = doc.addPage([size.w*dpi,size.h*dpi])
    pdfPage.pushOperators(
        pushGraphicsState(),
        scale(1,-1),
        translate(0,-pdfPage.getHeight())
    )
    page1.getPropValue('children').forEach(ch => {
        if(ch instanceof RectClass) {
            const bounds = ch.getPropValue('bounds')
            const fill = ch.getPropValue('fill')
            const draw_bounds = bounds.scale(dpi)
            pdfPage.drawRectangle({
                x:draw_bounds.x,
                y:draw_bounds.y,
                width:draw_bounds.w,
                height:draw_bounds.h,
                color: hex_to_pdfrgbf(fill),
            })
        }
        if(ch instanceof CircleClass) {
            const center = ch.getPropValue('center') as Point
            const radius = ch.getPropValue('radius') as number
            const fill = ch.getPropValue('fill') as string
            pdfPage.drawCircle({
                x: center.x*dpi,
                y: center.y*dpi,
                size: radius*dpi,
                color: hex_to_pdfrgbf(fill)
            })
        }
        if(ch instanceof PathShapeClass) {
            const pos = ch.getPropValue('center')
            const points = ch.getPropValue('points')
            const fill = ch.getPropValue('fill') as string
            for(let i=0; i<points.length; i++) {
                const start = points[i]
                const end = points[(i+1)%points.length]
                pdfPage.drawLine({
                    start:start.add(pos).scale(dpi),
                    end:end.add(pos).scale(dpi),
                    color:hex_to_pdfrgbf(fill)
                })
            }
        }
    })

    pdfPage.pushOperators(popGraphicsState())
}

export async function exportPDF(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    const doc = state.getCurrentDocument()
    const pdfDoc = await PDFDocument.create()
    doc.getPropValue('pages').forEach(page => render_pdf_page(pdfDoc,page as PageClass, doc.getPropValue('unit') as Unit))
    const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' })
    forceDownloadBlob('test.pdf',blob)
}
