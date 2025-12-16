// PDF Export utility for legal documents
import { jsPDF } from 'jspdf';

interface DocumentData {
  id: string;
  type: 'loi' | 'decret' | 'jurisprudence';
  numero: string;
  title: string;
  content: string;
  summary?: string;
  date: string;
  domaine: string;
  statut?: string;
  jortRef?: string;
}

interface ExportOptions {
  locale: string;
  includeHeader?: boolean;
  includeSummary?: boolean;
  includeContent?: boolean;
}

const TYPE_LABELS: Record<string, Record<string, string>> = {
  loi: { ar: 'قانون', fr: 'Loi', en: 'Law' },
  decret: { ar: 'مرسوم', fr: 'Décret', en: 'Decree' },
  jurisprudence: { ar: 'اجتهاد قضائي', fr: 'Jurisprudence', en: 'Case Law' },
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en_vigueur: { ar: 'ساري المفعول', fr: 'En vigueur', en: 'In force' },
  abroge: { ar: 'ملغى', fr: 'Abrogé', en: 'Repealed' },
  modifie: { ar: 'معدل', fr: 'Modifié', en: 'Modified' },
};

const DOMAINE_LABELS: Record<string, Record<string, string>> = {
  constitutionnel: { ar: 'دستوري', fr: 'Constitutionnel', en: 'Constitutional' },
  civil: { ar: 'مدني', fr: 'Civil', en: 'Civil' },
  penal: { ar: 'جزائي', fr: 'Pénal', en: 'Criminal' },
  commercial: { ar: 'تجاري', fr: 'Commercial', en: 'Commercial' },
  administratif: { ar: 'إداري', fr: 'Administratif', en: 'Administrative' },
  travail: { ar: 'شغل', fr: 'Travail', en: 'Labor' },
  fiscal: { ar: 'جبائي', fr: 'Fiscal', en: 'Tax' },
  famille: { ar: 'أحوال شخصية', fr: 'Famille', en: 'Family' },
  environnement: { ar: 'بيئة', fr: 'Environnement', en: 'Environment' },
  autres: { ar: 'أخرى', fr: 'Autres', en: 'Others' },
};

function getLabel(labels: Record<string, Record<string, string>>, key: string, locale: string): string {
  return labels[key]?.[locale] || labels[key]?.fr || key;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

export function generateDocumentPDF(
  documentData: DocumentData,
  options: ExportOptions = { locale: 'fr', includeHeader: true, includeSummary: true, includeContent: true }
): void {
  const { locale, includeHeader = true, includeSummary = true, includeContent = true } = options;
  const isArabic = locale === 'ar';

  // Create PDF (A4 format)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [0, 102, 51]; // SNIJ Green
  const textColor: [number, number, number] = [33, 33, 33];
  const mutedColor: [number, number, number] = [100, 100, 100];

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  if (includeHeader) {
    // Top border line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Logo/Title area
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SNIJ', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    const subtitle = isArabic
      ? 'المنظومة الوطنية للإعلام القانوني'
      : locale === 'en'
        ? 'National Legal Information System'
        : 'Système National d\'Information Juridique';
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
  }

  // Document Type Badge
  const typeLabel = getLabel(TYPE_LABELS, documentData.type, locale);
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos - 4, 35, 8, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(typeLabel.toUpperCase(), margin + 17.5, yPos, { align: 'center' });

  // Document number
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.text(documentData.numero, margin + 40, yPos);
  yPos += 12;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  const titleLines = splitTextToLines(doc, documentData.title, contentWidth);
  titleLines.forEach((line: string) => {
    checkNewPage(8);
    doc.text(line, margin, yPos);
    yPos += 7;
  });
  yPos += 5;

  // Metadata box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);

  // Row 1: Date & Domaine
  const dateLabel = isArabic ? 'التاريخ:' : locale === 'en' ? 'Date:' : 'Date:';
  const domaineLabel = isArabic ? 'المجال:' : locale === 'en' ? 'Domain:' : 'Domaine:';
  doc.text(`${dateLabel} ${formatDate(documentData.date, locale)}`, margin + 5, yPos);
  doc.text(`${domaineLabel} ${getLabel(DOMAINE_LABELS, documentData.domaine, locale)}`, pageWidth / 2, yPos);
  yPos += 6;

  // Row 2: Status & JORT Ref
  const statusLabel = isArabic ? 'الحالة:' : locale === 'en' ? 'Status:' : 'Statut:';
  const status = documentData.statut || 'en_vigueur';
  doc.text(`${statusLabel} ${getLabel(STATUS_LABELS, status, locale)}`, margin + 5, yPos);

  if (documentData.jortRef) {
    const jortLabel = isArabic ? 'مرجع الرائد:' : locale === 'en' ? 'JORT Ref:' : 'Réf. JORT:';
    doc.text(`${jortLabel} ${documentData.jortRef}`, pageWidth / 2, yPos);
  }
  yPos += 15;

  // Summary section
  if (includeSummary && documentData.summary) {
    checkNewPage(30);

    // Section header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    const summaryTitle = isArabic ? 'ملخص' : locale === 'en' ? 'Summary' : 'Résumé';
    doc.text(summaryTitle, margin, yPos);
    yPos += 2;

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + 30, yPos);
    yPos += 8;

    // Summary content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    const summaryLines = splitTextToLines(doc, documentData.summary, contentWidth);
    summaryLines.forEach((line: string) => {
      checkNewPage(6);
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 10;
  }

  // Content section
  if (includeContent && documentData.content) {
    checkNewPage(30);

    // Section header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    const contentTitle = isArabic ? 'النص الكامل' : locale === 'en' ? 'Full Text' : 'Texte intégral';
    doc.text(contentTitle, margin, yPos);
    yPos += 2;

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + 40, yPos);
    yPos += 8;

    // Content text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);

    // Split content into paragraphs
    const paragraphs = documentData.content.split('\n\n');
    paragraphs.forEach((para) => {
      if (para.trim()) {
        const lines = splitTextToLines(doc, para.trim(), contentWidth);
        lines.forEach((line: string) => {
          checkNewPage(6);
          doc.text(line, margin, yPos);
          yPos += 5;
        });
        yPos += 3; // Paragraph spacing
      }
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');

    const footerLeft = `SNIJ - ${new Date().toLocaleDateString(locale === 'ar' ? 'ar-TN' : 'fr-FR')}`;
    const footerRight = `${i} / ${totalPages}`;

    doc.text(footerLeft, margin, pageHeight - 10);
    doc.text(footerRight, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  const filename = `${documentData.type}-${documentData.numero.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
  doc.save(filename);
}

export function generateMultipleDocumentsPDF(
  documents: DocumentData[],
  options: ExportOptions = { locale: 'fr' }
): void {
  const { locale } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  documents.forEach((docData, index) => {
    if (index > 0) {
      doc.addPage();
    }
    // Add each document to the PDF
    // (simplified - you could integrate the full single doc logic)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${docData.type.toUpperCase()} ${docData.numero}`, 20, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(docData.title, 20, 40);
  });

  const filename = `snij-documents-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
