import re

with open('/home/al-ayada/Desktop/AFIA/components/ReportsView.tsx', 'r') as f:
    content = f.read()

# Replace the HTML tag
content = content.replace(
    'ref={reportRef}\n                        className="bg-white',
    'ref={reportRef}\n                        data-export-capture="financial-report"\n                        className="bg-white'
)

# Find the start and end of handleExportPDF
start_str = 'const handleExportPDF = async () => {'
end_str = '    };\n\n    const periodLabels:'

target_func = """const handleExportPDF = async () => {
        setIsGenerating(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حوسبة التقرير المالي الموحد',
            message: 'نقوم الآن بتحليل تدفقات السيولة، الإيرادات، والمصروفات التشغيلية لإنشاء وثيقة محاسبية رسمية، يرجى الانتظار...'
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!reportRef.current) throw new Error("لم يتم العثور على عنصر التقرير");

            const canvas = await html2canvas(reportRef.current, {
                scale: 3,
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    patchClonedSubtreeForHtml2Canvas(clonedDoc, {
                        exportId: 'financial-report',
                        fallbackColor: '#2D6A4F'
                    });
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgRatio = imgProps.width / imgProps.height;
            const finalImgWidth = pdfWidth;
            const finalImgHeight = pdfWidth / imgRatio;

            pdf.addImage(imgData, 'JPEG', 0, 0, finalImgWidth, finalImgHeight);

            const fileName = `Financial_Report_${settings.storeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم تصدير التقرير بنجاح',
                message: 'تم حفظ الكشف المحاسبي الموحد بجميع صفحاته وتفاصيله على جهازك بصيغة PDF.'
            });

            setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 3000);

        } catch (error) {
            console.error("PDF Generation error:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في معالجة البيانات',
                message: `عذراً، واجهنا صعوبة في تحويل البيانات إلى صيغة PDF.`
            });
        } finally {
            setIsGenerating(false);
        }
"""

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + target_func + content[end_idx:]
    with open('/home/al-ayada/Desktop/AFIA/components/ReportsView.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Failed to find boundaries")
