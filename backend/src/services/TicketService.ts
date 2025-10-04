import jsPDF from 'jspdf'
import { logger } from '@/config/logger'

export interface TicketData {
  bookingId: string
  customerName: string
  theaterName: string
  movieTitle: string
  showTime: string
  showDate: string
  screenName: string
  seatNumbers: string[]
  totalAmount: number
  contactEmail: string
  contactPhone: string
}

export class TicketService {
  static generateTicketPDF(ticketData: TicketData): Buffer {
    try {
      const doc = new jsPDF()

      // Set font
      doc.setFont('helvetica')

      // Header
      doc.setFontSize(20)
      doc.text('MOVIE TICKET', 105, 20, { align: 'center' })

      // Booking ID
      doc.setFontSize(12)
      doc.text(`Booking ID: ${ticketData.bookingId}`, 20, 40)

      // Customer Information
      doc.setFontSize(14)
      doc.text('Customer Information', 20, 60)
      doc.setFontSize(10)
      doc.text(`Name: ${ticketData.customerName}`, 20, 70)
      doc.text(`Email: ${ticketData.contactEmail}`, 20, 80)
      doc.text(`Phone: ${ticketData.contactPhone}`, 20, 90)

      // Show Details
      doc.setFontSize(14)
      doc.text('Show Details', 20, 110)
      doc.setFontSize(10)
      doc.text(`Movie: ${ticketData.movieTitle}`, 20, 120)
      doc.text(`Theater: ${ticketData.theaterName}`, 20, 130)
      doc.text(`Screen: ${ticketData.screenName}`, 20, 140)
      doc.text(`Date: ${ticketData.showDate}`, 20, 150)
      doc.text(`Show Time: ${ticketData.showTime}`, 20, 160)

      // Seat Information
      doc.setFontSize(14)
      doc.text('Seat Information', 20, 180)
      doc.setFontSize(10)
      doc.text(`Seats: ${ticketData.seatNumbers.join(', ')}`, 20, 190)
      doc.text(`Total Amount: ₹${ticketData.totalAmount}`, 20, 200)

      // QR Code placeholder (in a real implementation, you'd generate an actual QR code)
      doc.setFontSize(8)
      doc.text('QR Code:', 150, 180)
      doc.rect(150, 185, 30, 30) // Placeholder rectangle for QR code
      doc.text('Scan for verification', 150, 220)

      // Footer
      doc.setFontSize(8)
      doc.text('Please carry a valid ID proof during travel', 20, 250)
      doc.text('For support, contact customer service', 20, 260)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 270)

      // Convert to buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      logger.info('Ticket PDF generated successfully', { bookingId: ticketData.bookingId })
      return pdfBuffer

    } catch (error) {
      logger.error('Error generating ticket PDF', {
        error: (error as Error).message,
        bookingId: ticketData.bookingId
      })
      throw new Error('Failed to generate ticket PDF')
    }
  }
}