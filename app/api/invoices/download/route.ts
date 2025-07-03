import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import PDFDocument from "pdfkit"
import { join } from "path"
import { readFileSync } from "fs"

// Disable caching
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const invoiceId = searchParams.get("id")

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 })
  }

  const id = parseInt(invoiceId)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }

  // ✅ Use TTF font from public directory
  const fontPath = join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf")

  const doc = new PDFDocument()
  const chunks: Buffer[] = []

  doc.font(fontPath)

  // Generate PDF content
  doc.fontSize(20).text(`Invoice #${invoice.invoiceNumber}`, { align: "center" })
  doc.moveDown()

  doc.fontSize(12).text(`Project: ${invoice.project.name}`)
  doc.text(`Client: ${invoice.project.client?.name ?? "N/A"}`)
  doc.text(`Service Provider: ${invoice.serviceProvider}`)
  doc.text(`Invoice Amount: UGX ${invoice.amount.toLocaleString()}`)
  doc.text(`Invoice Date: ${invoice.invoiceDate.toDateString()}`)
  doc.text(`Date Received: ${invoice.dateReceived.toDateString()}`)

  if (invoice.procurementDescription) {
    doc.moveDown().text("Description:")
    doc.text(invoice.procurementDescription)
  }

  doc.end()

  doc.on("data", (chunk) => chunks.push(chunk))
  
  await new Promise<void>((resolve) => {
    doc.on("end", resolve)
  })

  const pdfBuffer = Buffer.concat(chunks)

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
    },
  })
}
