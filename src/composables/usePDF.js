import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import settings from '../data/settings.json'
import { formatDate, formatMoney } from './useQuote'

const colors = {
  primary: [37, 99, 235],
  text: [31, 41, 55],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  soft: [248, 250, 252],
  danger: [220, 38, 38],
}

function valueOf(maybeRef) {
  return maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef
}

/**
 * Build a compact client address block for the PDF.
 * @param {object} client
 */
function clientLines(client) {
  return [
    `${client.firstName} ${client.lastName}`.trim(),
    client.company,
    client.address,
    [client.zip, client.city].filter(Boolean).join(' '),
    client.email,
    client.phone,
  ].filter(Boolean)
}

/**
 * @param {{ state: object, totals: object }} quote
 * @param {{ download?: boolean }} options
 */
export function generateQuotePdf(quote, options = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  const company = settings.company
  const download = options.download ?? true

  function drawHeader() {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...colors.primary)
    doc.text(company.name, margin, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...colors.muted)
    doc.text([company.name, company.address, company.email, company.website].filter(Boolean), pageWidth - margin, 12, {
      align: 'right',
    })

    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(0.45)
    doc.line(margin, 27, pageWidth - margin, 27)
  }

  function drawFooter(pageNumber, pageCount) {
    const footerY = doc.internal.pageSize.getHeight() - 12
    doc.setDrawColor(...colors.border)
    doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
    doc.setFontSize(8)
    doc.setTextColor(...colors.muted)
    doc.text(
      `Devis valable ${settings.quote.validityDays} jours — Paiement sous ${settings.quote.paymentDays} jours dès facturation`,
      margin,
      footerY,
    )
    doc.text(`Page ${pageNumber} / ${pageCount}`, pageWidth - margin, footerY, { align: 'right' })
  }

  drawHeader()

  doc.setTextColor(...colors.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(`DEVIS N° ${quote.state.meta.quoteNumber}`, margin, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...colors.muted)
  doc.text(
    `Date d'émission: ${formatDate(quote.state.meta.issueDate)}    Date de validité: ${formatDate(quote.state.meta.validUntil)}`,
    margin,
    50,
  )

  doc.setFillColor(...colors.soft)
  doc.roundedRect(margin, 60, pageWidth - margin * 2, 30, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...colors.primary)
  doc.text('FACTURER À:', margin + 4, 68)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...colors.text)
  doc.text(clientLines(quote.state.client), margin + 4, 75)

  const body = []
  valueOf(quote.totals.rows).forEach((row) => {
    body.push([
      row.service.name,
      row.service.unit === 'hour' ? 'Prestation horaire' : row.service.description,
      row.quantity,
      formatMoney(row.unitPrice),
      formatMoney(row.serviceTotal),
    ])
    row.options.forEach((option) => {
      body.push(['  + ' + option.name, 'Option', 1, formatMoney(option.extraPrice), formatMoney(option.extraPrice)])
    })
  })

  autoTable(doc, {
    startY: 100,
    head: [['Prestation', 'Détail/Options', 'Qté', 'Prix unitaire', 'Total']],
    body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      lineColor: colors.border,
      textColor: colors.text,
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: colors.soft,
    },
    columnStyles: {
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
    },
    didParseCell(data) {
      if (data.row.raw?.[0]?.startsWith('  +')) {
        data.cell.styles.fontSize = 8
        data.cell.styles.textColor = colors.muted
      }
    },
  })

  const finalY = doc.lastAutoTable.finalY + 10
  const boxX = pageWidth - margin - 72
  const boxW = 72
  const lineH = 7
  const totalRows = [
    ['Sous-total', formatMoney(valueOf(quote.totals.servicesSubtotal))],
    valueOf(quote.totals.travelFees) > 0 && ['Déplacement', formatMoney(valueOf(quote.totals.travelFees))],
    valueOf(quote.totals.urgencyFees) > 0 && ['Urgence', formatMoney(valueOf(quote.totals.urgencyFees))],
    valueOf(quote.totals.discountAmount) > 0 && [
      `Remise (-${quote.state.global.discountPercent}%)`,
      `-${formatMoney(valueOf(quote.totals.discountAmount))}`,
    ],
    settings.vat.enabled
      ? [`TVA ${settings.vat.rate}%`, formatMoney(valueOf(quote.totals.vatAmount))]
      : [settings.vat.exemptionText, ''],
  ].filter(Boolean)

  doc.setDrawColor(...colors.border)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(boxX, finalY, boxW, totalRows.length * lineH + 12, 2, 2, 'FD')
  let y = finalY + 7
  totalRows.forEach(([label, value]) => {
    doc.setFontSize(label === settings.vat.exemptionText ? 7 : 9)
    doc.setTextColor(label.startsWith('Remise') ? colors.danger[0] : colors.text[0], label.startsWith('Remise') ? colors.danger[1] : colors.text[1], label.startsWith('Remise') ? colors.danger[2] : colors.text[2])
    doc.text(label, boxX + 4, y)
    if (value) doc.text(value, boxX + boxW - 4, y, { align: 'right' })
    y += lineH
  })

  doc.setFillColor(...colors.primary)
  doc.roundedRect(boxX, y - 1, boxW, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL TTC', boxX + 4, y + 6)
  doc.text(formatMoney(valueOf(quote.totals.total)), boxX + boxW - 4, y + 6, { align: 'right' })

  if (quote.state.client.projectDescription) {
    const noteY = Math.max(finalY, y + 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...colors.text)
    doc.text('Description du projet', margin, noteY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...colors.muted)
    doc.text(doc.splitTextToSize(quote.state.client.projectDescription, 110), margin, noteY + 6)
  }

  const pageCount = doc.internal.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    drawHeader()
    drawFooter(page, pageCount)
  }

  const fileName = `${quote.state.meta.quoteNumber}.pdf`
  const base64 = doc.output('datauristring').split(',')[1]

  if (download) {
    doc.save(fileName)
  }

  return { doc, fileName, base64 }
}
