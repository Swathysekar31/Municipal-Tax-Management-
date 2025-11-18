import { jsPDF } from 'jspdf';

export const generateTaxReceiptPDF = (receiptData) => {
    const {
        receiptNumber,
        transactionId,
        customerName,
        doorNo,
        wardNo,
        taxType,
        amount,
        period,
        paymentDate,
        quarter
    } = receiptData;

    // Create new PDF document
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
        title: `Tax Receipt - ${receiptNumber}`,
        subject: 'Municipal Tax Payment Receipt',
        author: 'Municipal Corporation',
        keywords: 'tax, receipt, payment',
        creator: 'Municipal Tax System'
    });

    // Colors
    const primaryColor = [41, 128, 185]; // Blue
    const secondaryColor = [52, 152, 219]; // Light Blue
    const accentColor = [46, 204, 113]; // Green
    const textColor = [52, 73, 94]; // Dark Gray
    const lightGray = [247, 247, 247];

    // Add header with gradient effect
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Municipal Corporation Logo/Text
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MUNICIPAL CORPORATION', 105, 18, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL TAX PAYMENT RECEIPT', 105, 28, { align: 'center' });

    // Receipt Number Section
    doc.setFillColor(...lightGray);
    doc.roundedRect(20, 50, 170, 25, 3, 3, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(20, 50, 170, 25, 3, 3);
    
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`RECEIPT NO: ${receiptNumber}`, 105, 62, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Transaction ID: ${transactionId || receiptNumber}`, 105, 68, { align: 'center' });

    let yPosition = 90;

    // Customer Details Section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(20, yPosition, 82, 45, 3, 3, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(20, yPosition, 82, 45, 3, 3);
    
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS', 25, yPosition + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Name: ${customerName}`, 25, yPosition + 18);
    doc.text(`Door No: ${doorNo}`, 25, yPosition + 25);
    doc.text(`Ward No: ${wardNo}`, 25, yPosition + 32);

    // Payment Details Section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(108, yPosition, 82, 45, 3, 3, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(108, yPosition, 82, 45, 3, 3);
    
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 113, yPosition + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Tax Type: ${taxType}`, 113, yPosition + 18);
    doc.text(`Period: ${period}`, 113, yPosition + 25);
    doc.text(`Payment Date: ${paymentDate}`, 113, yPosition + 32);
    doc.text(`Payment Method: Online`, 113, yPosition + 39);

    yPosition += 60;

    // Amount Box (Highlighted)
    doc.setFillColor(232, 245, 233);
    doc.setDrawColor(76, 175, 80);
    doc.roundedRect(55, yPosition, 100, 35, 5, 5, 'F');
    doc.roundedRect(55, yPosition, 100, 35, 5, 5);
    
    doc.setFontSize(14);
    doc.setTextColor(27, 94, 32);
    doc.setFont('helvetica', 'bold');
    doc.text('AMOUNT PAID', 105, yPosition + 12, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setTextColor(46, 125, 50);
    doc.text(`₹${amount}`, 105, yPosition + 28, { align: 'center' });

    yPosition += 50;

    // Status Section
    doc.setFillColor(225, 245, 254);
    doc.roundedRect(20, yPosition, 170, 20, 3, 3, 'F');
    doc.setDrawColor(2, 136, 209);
    doc.roundedRect(20, yPosition, 170, 20, 3, 3);
    
    doc.setFontSize(12);
    doc.setTextColor(2, 136, 209);
    doc.setFont('helvetica', 'bold');
    doc.text('✅ PAYMENT SUCCESSFUL', 105, yPosition + 12, { align: 'center' });

    yPosition += 35;

    // Footer Section
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Thank you for your timely payment!', 105, yPosition, { align: 'center' });
    doc.text('This is a computer generated receipt and does not require signature.', 105, yPosition + 5, { align: 'center' });
    
    yPosition += 15;
    
    // Contact Information
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('For any queries, contact: support@municipal.gov | +91-1800-123-4567', 105, yPosition, { align: 'center' });
    doc.text('Municipal Corporation Office: Town Hall, Main Road, City - 560001', 105, yPosition + 4, { align: 'center' });

    // Security Features
    yPosition += 12;
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text('🔒 SSL Encrypted | 💳 PCI DSS Compliant | 📱 3D Secure Verified', 105, yPosition, { align: 'center' });

    // Add decorative border
    doc.setDrawColor(220, 220, 220);
    doc.rect(5, 5, 200, 287);

    return doc;
};

export const downloadReceiptPDF = (receiptData) => {
    try {
        const doc = generateTaxReceiptPDF(receiptData);
        const fileName = `tax_receipt_${receiptData.receiptNumber}_${Date.now()}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback to text receipt
        downloadTextReceipt(receiptData);
    }
};

const downloadTextReceipt = (receiptData) => {
    const receiptContent = `
╔══════════════════════════════════════════════════════════════╗
║                  MUNICIPAL CORPORATION                       ║
║                TAX PAYMENT RECEIPT                           ║
╚══════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────┐
│ RECEIPT NO: ${receiptData.receiptNumber.padEnd(40)} │
│ Transaction ID: ${(receiptData.transactionId || receiptData.receiptNumber).padEnd(33)} │
└──────────────────────────────────────────────────────────────┘

CUSTOMER DETAILS:
├──────────────────────────────────────────────────────────────┤
│ Name: ${receiptData.customerName.padEnd(47)} │
│ Door No: ${receiptData.doorNo.padEnd(45)} │
│ Ward No: ${receiptData.wardNo.padEnd(45)} │
└──────────────────────────────────────────────────────────────┘

PAYMENT DETAILS:
├──────────────────────────────────────────────────────────────┤
│ Tax Type: ${receiptData.taxType.padEnd(43)} │
│ Amount Paid: ₹${receiptData.amount.toString().padEnd(39)} │
│ Period: ${receiptData.period.padEnd(46)} │
│ Payment Date: ${receiptData.paymentDate.padEnd(40)} │
│ Payment Method: Online${' '.padEnd(35)} │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    STATUS: PAYMENT SUCCESSFUL                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      AMOUNT PAID                             │
│                         ₹${receiptData.amount.toString().padStart(8).padEnd(8)}                          │
└──────────────────────────────────────────────────────────────┘

Thank you for your payment!
This is a computer generated receipt and does not require signature.

For any queries, contact: support@municipal.gov | +91-1800-123-4567
🔒 Secure Payment | 💳 PCI DSS Compliant | 📱 3D Secure
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${receiptData.receiptNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};