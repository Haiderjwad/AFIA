const fs = require('fs');
let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/ReportsView.tsx', 'utf8');

// 1. Remove sticky behavior from the preview header
content = content.replace(
  'sticky top-0 z-30 mb-8 bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] shadow-xl border border-white flex flex-col sm:flex-row justify-between items-center gap-4',
  'relative z-10 mb-8 bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] shadow-xl border border-white flex flex-col sm:flex-row justify-between items-center gap-4'
);

// 2. Translate English text in footer to Arabic
content = content.replace(
  'Automated Financial Export • Golden POS Analytics',
  'تصدير مالي مؤتمت • تحليلات عافية السحابية'
);
content = content.replace(
  'CONFIDENTIAL & INTERNAL USE ONLY',
  'سري وللاستخدام الداخلي فقط'
);

// 3. Fix the PDF export function
// I will replace handleExportPDF with a robust one-page capture since the template is exactly A4 dimensions.
const newPdfExportCode = `    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setIsGenerating(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حوسبة التقرير المالي الموحد',
            message: 'نقوم الآن بتحليل تدفقات السيولة، الإيرادات، والمصروفات التشغيلية لإنشاء وثيقة محاسبية رسمية، يرجى الانتظار...'
        });

        const exportId = 'financial-report';
        reportRef.current.setAttribute('data-export-capture', exportId);

        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // allow fonts to render

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    patchClonedSubtreeForHtml2Canvas(clonedDoc, {
                        exportId,
                        attributeName: 'data-export-capture',
                        fallbackColor: '#2D6A4F'
                    });
                }
            });

            // Since the rendered div is exactly A4 proportion (w-[210mm] min-h-[297mm]), 
            // we can just put the whole canvas onto a single A4 page.
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate height proportionately 
            const imgRatio = canvas.height / canvas.width;
            const imgHeight = pdfWidth * imgRatio;
            
            // Output single page to avoid splitting visually cohesive elements
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);

            const fileName = \`التقرير_المالي_\${settings.storeName}_\${new Date().toISOString().split('T')[0]}.pdf\`;
            pdf.save(fileName);

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم تصدير التقرير بنجاح',
                message: 'تم حفظ الكشف المحاسبي الموحد بجميع صفحاته وتفاصيله على جهازك.'
            });

            setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 3000);

        } catch (error) {
            console.error("PDF Generation error:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في معالجة البيانات',
                message: 'عذراً، واجهنا صعوبة في تحويل البيانات إلى صيغة PDF. يرجى المحاولة مرة أخرى.'
            });
        } finally {
            setIsGenerating(false);
            reportRef.current?.removeAttribute('data-export-capture');
        }
    };`;

// We must carefully replace the entire handleExportPDF block
// Using regex to match from "const handleExportPDF = async () => {" to "};" before "const periodLabels"
const regex = /const handleExportPDF = async \(\) => {[\s\S]*?};\s*(?=const periodLabels)/;
content = content.replace(regex, newPdfExportCode + '\n\n    ');

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/ReportsView.tsx', content);

