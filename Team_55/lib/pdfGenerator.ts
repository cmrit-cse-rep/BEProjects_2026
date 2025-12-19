import jsPDF from 'jspdf';
import { IItinerary, IDay, IActivity } from '@/models/Itinerary';
import { formatCostToINR } from './currencyUtils';
import { format } from 'date-fns';

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export function downloadItineraryPDF(itinerary: IItinerary) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;
  const lineHeight = 7;
  const sectionGap = 10;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const rgb = hexToRgb(color);
    if (rgb) {
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    
    const maxWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Title
  addText(itinerary.title, 20, true, '#1e40af');
  yPosition += sectionGap;

  // Destination and basic info
  addText(`Destination: ${itinerary.destination}`, 14, true);
  addText(`Duration: ${itinerary.totalDays} day${itinerary.totalDays > 1 ? 's' : ''}`, 12);
  addText(`Budget: ${formatCostToINR(itinerary.budget)}`, 12);
  
  if (itinerary.interests && itinerary.interests.length > 0) {
    addText(`Interests: ${itinerary.interests.join(', ')}`, 12);
  }
  
  yPosition += sectionGap;

  // Summary
  if (itinerary.summary) {
    addText('Trip Summary', 16, true, '#7c3aed');
    yPosition += 5;
    
    if (itinerary.summary.totalEstimatedCost) {
      addText(`Total Estimated Cost: ${formatCostToINR(itinerary.summary.totalEstimatedCost)}`, 12, true);
    }
    
    if (itinerary.summary.highlights && itinerary.summary.highlights.length > 0) {
      addText('Highlights:', 12, true);
      itinerary.summary.highlights.forEach((highlight) => {
        addText(`• ${highlight}`, 11);
      });
    }
    
    if (itinerary.summary.tips && itinerary.summary.tips.length > 0) {
      yPosition += 5;
      addText('Tips:', 12, true);
      itinerary.summary.tips.forEach((tip) => {
        addText(`• ${tip}`, 11);
      });
    }
    
    yPosition += sectionGap;
  }

  // Day-by-day itinerary
  if (itinerary.days && itinerary.days.length > 0) {
    itinerary.days.forEach((day: IDay, dayIndex: number) => {
      checkPageBreak(30);
      
      // Day header
      addText(`Day ${day.day || dayIndex + 1}`, 16, true, '#059669');
      yPosition += 5;
      
      if (day.date) {
        addText(day.date, 12);
      }
      
      // Activities
      if (day.activities && day.activities.length > 0) {
        day.activities.forEach((activity: IActivity, activityIndex: number) => {
          checkPageBreak(25);
          
          // Activity time and title
          addText(`${activity.time} - ${activity.title}`, 12, true, '#2563eb');
          
          if (activity.location) {
            addText(`📍 ${activity.location}`, 10);
          }
          
          if (activity.description) {
            addText(activity.description, 10);
          }
          
          // Activity details
          let details = [];
          if (activity.duration) details.push(`Duration: ${activity.duration}`);
          if (activity.cost) details.push(`Cost: ${formatCostToINR(activity.cost)}`);
          if (activity.category) details.push(`Category: ${activity.category}`);
          
          if (details.length > 0) {
            addText(details.join(' | '), 9, false, '#6b7280');
          }
          
          yPosition += 5;
        });
      }
      
      // Day total cost
      if (day.totalCost) {
        addText(`Day Total: ${formatCostToINR(day.totalCost)}`, 11, true, '#16a34a');
      }
      
      // Day notes
      if (day.notes) {
        addText(`Notes: ${day.notes}`, 10, false, '#6b7280');
      }
      
      yPosition += sectionGap;
      
      // Add separator line
      if (dayIndex < itinerary.days.length - 1) {
        checkPageBreak(5);
        doc.setDrawColor('#e5e7eb');
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += sectionGap;
      }
    });
  }

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#6b7280');
    doc.text(
      `Generated by Smart Tourism Planner • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    if (itinerary.createdAt) {
      doc.text(
        `Created: ${format(new Date(itinerary.createdAt), 'MMM dd, yyyy')}`,
        margin,
        pageHeight - 10
      );
    }
  }

  // Download PDF
  const fileName = `${itinerary.destination.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.pdf`;
  doc.save(fileName);
}

