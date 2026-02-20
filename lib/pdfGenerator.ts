import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { FoundItem, User } from '@/types';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { getUsers } from './storage';

// Import Roboto fonts as base64
import robotoRegularUrl from '@/assets/fonts/Roboto-Regular.ttf';
import robotoBoldUrl from '@/assets/fonts/Roboto-Bold.ttf';

// Generate QR code as data URL
export const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
};

// Format date in Hungarian
const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), 'yyyy. MM. dd.', { locale: hu });
};

// Get user by ID
const getUserById = (userId: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.id === userId);
};

// Company name placeholder
const COMPANY_NAME = 'CÉG';

// Check if finder is employee
const isEmployeeFinder = (finderName: string): boolean => {
  const lowerName = finderName.toLowerCase();
  return lowerName.includes('dolgozó') || lowerName.includes('munkavállaló') || lowerName.includes('alkalmazott');
};

// Load font as base64
const loadFontAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Generate A4 registration sheet PDF with 3 sections matching the sample
export const generateRegistrationSheetPDF = async (item: FoundItem): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load and add Roboto fonts
  try {
    const [robotoRegularBase64, robotoBoldBase64] = await Promise.all([
      loadFontAsBase64(robotoRegularUrl),
      loadFontAsBase64(robotoBoldUrl),
    ]);

    doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    
    doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    
    doc.setFont('Roboto');
  } catch (error) {
    console.error('Failed to load Roboto fonts, using default:', error);
    doc.setFont('helvetica');
  }

  const pageWidth = 210;
  const pageHeight = 297;
  
  // Margins as specified
  const marginTop = 6; // 0.6 cm
  const marginLeft = 25; // 2.5 cm
  const marginRight = 20; // 2 cm
  const marginBottom = 6; // 0.6 cm
  
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Generate QR code for the item ID
  const qrCodeDataUrl = await generateQRCode(item.id);

  // Get creator user info
  const creatorUser = getUserById(item.createdByUserId);
  const creatorName = creatorUser?.name || 'Ismeretlen';

  // Format brand info
  const brandInfo = item.brand ? ` (${[item.material, item.color, item.shape].filter(Boolean).join(', ') || item.brand})` : '';
  const brandLine = item.brand ? `${item.brand}${item.material || item.color || item.shape ? ` (${[item.material, item.color, item.shape].filter(Boolean).join(', ')})` : ''}` : '';

  // Section calculations
  const qrSize = 25;
  const section1Top = marginTop;
  const section1Height = 45;
  const section1BottomLine = section1Top + section1Height;
  
  // Calculate section 2 and 3 based on content
  const section2Top = section1BottomLine + 3;
  
  // Helper function to draw scissors icon at start and end of dashed line
  const drawScissorsLine = (y: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    doc.setLineDashPattern([], 0);
    
    // Draw scissors symbols
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('✂', marginLeft - 6, y + 1);
    doc.text('✂', pageWidth - marginRight + 2, y + 1);
    doc.setTextColor(0, 0, 0);
  };

  // ==========================================
  // 1. NYILVÁNTARTÓ CÍMKE (no label, first section)
  // ==========================================
  let currentY = section1Top + 8;
  
  // Item name - large bold
  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.text(item.itemName, marginLeft, currentY);
  
  currentY += 6;
  
  // Brand info if exists
  if (brandLine) {
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(brandLine, marginLeft, currentY);
    currentY += 5;
  }
  
  // Location and date
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text(`${item.foundLocation}, ${formatDate(item.foundDate)}`, marginLeft, currentY);
  
  // QR Code on the right
  if (qrCodeDataUrl) {
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - marginRight - qrSize, section1Top + 2, qrSize, qrSize);
  }
  
  // ID under QR code
  currentY = section1Top + qrSize + 7;
  doc.setFontSize(8);
  doc.setFont('Roboto', 'normal');
  const idTextWidth = doc.getTextWidth(item.id);
  doc.text(item.id, pageWidth - marginRight - qrSize / 2 - idTextWidth / 2, currentY);

  // Dashed line with scissors
  drawScissorsLine(section1BottomLine);

  // ==========================================
  // 2. NYILVÁNTARTÁS (second section)
  // ==========================================
  currentY = section2Top + 8;
  
  // Section title with ID on same line
  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.text(item.itemName, marginLeft, currentY);
  
  // ID on the right of title
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text(item.id, pageWidth - marginRight - doc.getTextWidth(item.id), currentY);
  
  currentY += 6;
  
  // Brand info
  if (brandLine) {
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(brandLine, marginLeft, currentY);
    currentY += 5;
  }
  
  // Location and date
  doc.setFontSize(10);
  doc.text(`${item.foundLocation}, ${formatDate(item.foundDate)}`, marginLeft, currentY);
  
  currentY += 10;
  
  // Right side vertical box with date, item name, and ID (rotated 90 degrees)
  const sidebarX = pageWidth - marginRight + 2;
  const sidebarTop = section2Top + 5;
  const sidebarHeight = 150;
  
  // Draw vertical line to separate sidebar
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - marginRight - 2, sidebarTop, pageWidth - marginRight - 2, sidebarTop + sidebarHeight);
  
  // Rotated text - date, item name, ID (rotated 90 degrees clockwise)
  doc.setFontSize(10);
  doc.setFont('Roboto', 'bold');
  
  // Save state and rotate
  const rotateAngle = 90;
  
  // ID (topmost when rotated)
  doc.text(item.id, sidebarX, sidebarTop + 15, { angle: rotateAngle });
  
  // Bullet point
  doc.setFontSize(8);
  doc.text('•', sidebarX, sidebarTop + 30, { angle: rotateAngle });
  
  // Item name
  doc.setFontSize(12);
  doc.setFont('Roboto', 'bold');
  doc.text(item.itemName, sidebarX, sidebarTop + 45, { angle: rotateAngle });
  
  // Bullet point
  doc.setFontSize(8);
  doc.text('•', sidebarX, sidebarTop + 95, { angle: rotateAngle });
  
  // Date
  doc.setFontSize(12);
  doc.text(formatDate(item.foundDate), sidebarX, sidebarTop + 110, { angle: rotateAngle });

  // Recipient data section
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text('Átvevő neve: ___________________________________________________________________________', marginLeft, currentY);
  currentY += 7;
  doc.text('Átvevő lakcíme: ________________________________________________________________________', marginLeft, currentY);
  currentY += 7;
  doc.text('___________________________________________________________________________________________', marginLeft, currentY);
  currentY += 7;
  doc.text('Személyazonosító okmány típusa és azonosítója: _________________________________________', marginLeft, currentY);
  
  currentY += 12;
  
  // Owner statement
  doc.setFontSize(9);
  doc.setFont('Roboto', 'normal');
  const ownerStatement = `Átvevő adatainál megjelölt személyként elismerem, hogy mai napon, a '${COMPANY_NAME}' képviselője, a megjelölt tárgyat, mint személyes tulajdonomat részemre átadta. A tárgyat megvizsgáltam, azzal kapcsolatban mennyiségi, minőségi kifogást nem támasztok a '${COMPANY_NAME}' felé, egyidejűleg elismerem, hogy általam történő elhagyása és megtalálása között a tárgy mennyiségi, minőségi változásaiért a '${COMPANY_NAME}' nem tartozik felelősséggel. Meggyőződtem arról, hogy a '${COMPANY_NAME}' a tárgyat annak megtalálásától az elvárható gondossággal őrizte meg.`;
  
  const ownerLines = doc.splitTextToSize(ownerStatement, contentWidth - 25);
  doc.text(ownerLines, marginLeft, currentY);
  currentY += ownerLines.length * 4 + 10;
  
  // Three signature fields in one row
  const signatureWidth = (contentWidth - 25) / 3;
  doc.text('__________________', marginLeft, currentY);
  doc.text('__________________', marginLeft + signatureWidth, currentY);
  doc.text('__________________', marginLeft + signatureWidth * 2, currentY);
  currentY += 4;
  
  doc.setFontSize(8);
  doc.text('dátum', marginLeft + 15, currentY);
  doc.text('átadó', marginLeft + signatureWidth + 15, currentY);
  doc.text('átvevő', marginLeft + signatureWidth * 2 + 15, currentY);
  
  currentY += 12;
  
  // Finder section - check if employee
  const isEmployee = isEmployeeFinder(item.finderName);
  
  if (isEmployee) {
    // Employee found the item during daily closing
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(`A tárgyat a napi zárás során a '${COMPANY_NAME}' munkavállalója találta.`, marginLeft, currentY);
    currentY += 15;
  } else {
    // Regular finder section
    doc.setFontSize(11);
    doc.setFont('Roboto', 'bold');
    const finderAddress = item.finderContact ? ` (${item.finderContact})` : '';
    doc.text(`${item.finderName}${finderAddress}`, marginLeft, currentY);
    currentY += 5;
    
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    const finderStatement = `mint találó kijelentem, hogy az általam talált fent megjelölt tárgy NEM tartozik a személyes és közeli hozzátartozóim tulajdona körébe, így annak tulajdonjogára sem most, sem később nem tartok igényt. Egyben kijelentem, hogy megértettem és tudomásul veszem, hogy az átvételi elismervényen található figyelmeztetés szerint az átvételi elismervény nem jogosít a talált tárgy kiadására.`;
    
    const finderLines = doc.splitTextToSize(finderStatement, contentWidth - 25);
    doc.text(finderLines, marginLeft, currentY);
    currentY += finderLines.length * 3.5 + 8;
    
    // Date and two signatures
    doc.setFontSize(10);
    doc.text(formatDate(item.foundDate), marginLeft, currentY);
    
    const sigSpacing = (contentWidth - 25 - 30) / 2;
    doc.text('__________________', marginLeft + 40 + sigSpacing * 0.5, currentY);
    doc.text('__________________', marginLeft + 40 + sigSpacing * 1.5, currentY);
    currentY += 4;
    
    doc.setFontSize(8);
    doc.text('átadó', marginLeft + 40 + sigSpacing * 0.5 + 15, currentY);
    doc.text('cég képviselője', marginLeft + 40 + sigSpacing * 1.5 + 5, currentY);
    currentY += 4;
    
    doc.setFont('Roboto', 'normal');
    doc.text(item.finderName, marginLeft + 40 + sigSpacing * 0.5 + 5, currentY);
    doc.text(creatorName, marginLeft + 40 + sigSpacing * 1.5 + 5, currentY);
  }
  
  // Calculate where section 2 ends
  const section2BottomLine = currentY + 8;

  // Dashed line with scissors
  drawScissorsLine(section2BottomLine);

  // ==========================================
  // 3. ÁTVÉTELI ELISMERVÉNY (third section)
  // ==========================================
  currentY = section2BottomLine + 10;
  
  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.text('Átvételi elismervény', marginLeft, currentY);
  currentY += 10;
  
  // Item info
  doc.setFontSize(12);
  doc.setFont('Roboto', 'bold');
  doc.text(item.itemName, marginLeft, currentY);
  currentY += 5;
  
  // Brand info
  if (brandLine) {
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(brandLine, marginLeft, currentY);
    currentY += 6;
  }
  
  // Finder name with address
  doc.setFontSize(11);
  doc.setFont('Roboto', 'bold');
  if (!isEmployee) {
    const finderAddress = item.finderContact ? ` (${item.finderContact})` : '';
    doc.text(`${item.finderName}${finderAddress}`, marginLeft, currentY);
    currentY += 8;
  } else {
    doc.setFont('Roboto', 'normal');
    doc.text(`A '${COMPANY_NAME}' munkavállalója`, marginLeft, currentY);
    currentY += 8;
  }
  
  // Acknowledgment statement
  doc.setFontSize(9);
  doc.setFont('Roboto', 'normal');
  const ackStatement = `A „${COMPANY_NAME.toLowerCase()}" képviseletében elismerem, hogy a fent megnevezett tárgyat, megnevezett találótól átvettük. Egyben tájékoztattam a találót, hogy ezen átvételi elismervény NEM jogosít a talált tárgy találó részére történő kiadására.`;
  
  const ackLines = doc.splitTextToSize(ackStatement, contentWidth);
  doc.text(ackLines, marginLeft, currentY);
  currentY += ackLines.length * 3.5 + 10;
  
  // Date and signature
  doc.setFontSize(10);
  doc.text(formatDate(item.foundDate), marginLeft, currentY);
  
  // ph (stamp placeholder) and signature
  doc.text('ph', marginLeft + 60, currentY);
  doc.text('__________________', marginLeft + 90, currentY);
  currentY += 4;
  
  doc.setFontSize(8);
  doc.text(creatorName, marginLeft + 105, currentY);

  // Save the PDF
  doc.save(`nyilvantarto_${item.id}.pdf`);
};
