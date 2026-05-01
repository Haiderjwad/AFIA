const fs = require('fs');
let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', 'utf8');

const reportCode = `  const generateIndividualReport = async (supplier: Supplier) => {
    setIsExporting(true);
    setStatusModal({
      isOpen: true,
      type: 'loading',
      title: 'جاري إعداد الكشف الفردي للمورد',
      message: 'نقوم الآن بمعالجة وتجهيز الكشف المخصص لهذا المورد...'
    });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-5000px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.dir = 'rtl';
      document.body.appendChild(tempContainer);

      tempContainer.innerHTML = \`
        <div style="width: 210mm; padding: 15mm; font-family: 'Cairo', sans-serif; display: flex; flex-direction: column; box-sizing: border-box; background-color: white; position: relative;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #1B4332; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; gap: 20px;">
              <div style="width: 80px; height: 80px; background-color: #1B4332; border-radius: 20px; display: flex; items-center; justify-content: center; padding: 10px;">
                <img src="/branding/afia_logo.png" style="width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1);" />
              </div>
              <div>
                <h1 style="margin: 0; color: #1B4332; font-size: 26pt; font-weight: 900;">\${settings.storeName}</h1>
                <p style="margin: 5px 0 0; color: #2D6A4F; font-weight: 800; font-size: 11pt; text-transform: uppercase;">كشف حساب مورد فردي</p>
              </div>
            </div>
            <div style="text-align: left; background-color: #f8f9fa; padding: 15px 25px; border-radius: 20px; border: 1px solid #eee;">
              <div style="font-weight: 900; color: #1B4332; font-size: 10pt; margin-bottom: 5px;">كشف رقم: #IND-\${new Date().getTime().toString().slice(-6)}</div>
              <div style="color: #666; font-size: 9pt; font-weight: 700;">التاريخ: \${new Date().toLocaleDateString('ar-IQ')}</div>
            </div>
          </div>

          <!-- Supplier Details -->
          <div style="background-color: #f8f9fa; border: 1px solid #eee; border-radius: 25px; padding: 30px; margin-bottom: 35px;">
            <h2 style="margin: 0 0 20px 0; color: #1B4332; font-size: 18pt; font-weight: 900;">بيانات الجهة الموردة</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="color: #666; font-size: 10pt; font-weight: 700; margin-bottom: 5px;">الاسم / الشركة</div>
                <div style="color: #333; font-size: 14pt; font-weight: 900;">\${supplier.name}</div>
              </div>
              <div>
                <div style="color: #666; font-size: 10pt; font-weight: 700; margin-bottom: 5px;">التصنيف</div>
                <div style="color: #333; font-size: 14pt; font-weight: 900;">\${supplier.category}</div>
              </div>
              <div>
                <div style="color: #666; font-size: 10pt; font-weight: 700; margin-bottom: 5px;">السلعة الرئيسية</div>
                <div style="color: #333; font-size: 12pt; font-weight: 900;">\${supplier.suppliedItem}</div>
              </div>
              <div>
                <div style="color: #666; font-size: 10pt; font-weight: 700; margin-bottom: 5px;">رقم الهاتف</div>
                <div style="color: #333; font-size: 12pt; font-weight: 900;">\${supplier.phone}</div>
              </div>
            </div>
          </div>

          <!-- Financial Summary -->
          <h2 style="margin: 0 0 20px 0; color: #1B4332; font-size: 18pt; font-weight: 900;">الخلاصة المالية</h2>
          <table style="width: 100%; border-collapse: separate; border-spacing: 0 10px; margin-bottom: 40px;">
            <thead>
              <tr style="background-color: #1B4332; color: white;">
                <th style="padding: 20px 15px; text-align: right; border-radius: 0 15px 15px 0; font-size: 12pt;">سعر الوحدة</th>
                <th style="padding: 20px 15px; text-align: right; font-size: 12pt;">وتيرة التوريد</th>
                <th style="padding: 20px 15px; text-align: right; font-size: 12pt;">آخر معاملة</th>
                <th style="padding: 20px 15px; text-align: right; border-radius: 15px 0 0 15px; font-size: 12pt;">إجمالي الاستحقاق</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: #fff; border: 1px solid #eee;">
                <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; font-weight: 900; color: #1B4332; font-size: 14pt;">\${formatCurrency(supplier.costPerUnit, settings.currency)}</td>
                <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; font-weight: 700;">\${supplier.frequency === 'daily' ? 'توريد يومي' : supplier.frequency === 'weekly' ? 'توريد أسبوعي' : supplier.frequency === 'monthly' ? 'توريد شهري' : 'توريد سنوي'}</td>
                <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; color: #777; font-size: 12pt; font-weight: 700;">\${supplier.lastSupplyDate}</td>
                <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; font-weight: 900; color: #1B4332; font-size: 16pt;">\${formatCurrency(supplier.totalPaid, settings.currency)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer Section -->
          <div style="margin-top: auto; padding-top: 30px; border-top: 2px solid #1B4332;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <span style="color: #1B4332; font-weight: 900; font-size: 10pt;">نظام عافية - لإدارة المؤسسات</span>
              <div style="color: #999; font-size: 8pt; font-weight: 700;">تم التوليد بواسطة: حوسبة عافية السحابية (Afia Cloud)</div>
            </div>
          </div>
        </div>
      \`;

      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, (canvas.height * pageWidth) / canvas.width);
      
      document.body.removeChild(tempContainer);
      pdf.save(\`كشف_فردي_\${supplier.name.replace(/\\s+/g, '_')}_\${new Date().toISOString().split('T')[0]}.pdf\`);

      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'اكتمل التصدير بنجاح',
        message: 'تم توليد كشف المورد الفردي وحفظه على جهازك.'
      });

      setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 3000);

    } catch (error) {
      console.error("Single Report generation failed:", error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'فشل تصدير الكشف',
        message: 'حدث خطأ فني أثناء إعداد الكشف الفردي.'
      });
    } finally {
      setIsExporting(false);
      setPrintIndividualModal(null);
    }
  };`;

content = content.replace(/const generateReport = async \(\) => {/, reportCode + '\n\n  const generateReport = async () => {');

// We also need to add modals to JSX
const modalsCode = `
      {/* Supplier Info Modal */}
      {supplierInfoModal && (
        <div className="fixed top-20 right-0 lg:right-28 left-0 bottom-0 z-[80] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-brand-dark dark:border-white/10 w-full max-w-lg rounded-[3.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20">
            <div className="p-10 flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] animate-ping opacity-20"></div>
                <Users size={48} className="text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-brand-dark dark:text-white mb-2">{supplierInfoModal.name}</h2>
              <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary dark:text-brand-accent text-xs font-black rounded-full mb-8">
                  {supplierInfoModal.category}
              </span>

              <div className="w-full space-y-4 text-right mb-10">
                <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center text-brand-primary"><Phone size={20} /></div>
                  <div>
                      <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mb-1">رقم الهاتف</p>
                      <p className="text-brand-dark dark:text-white font-black text-lg" dir="ltr">{supplierInfoModal.phone}</p>
                  </div>
                </div>
                {supplierInfoModal.email && (
                  <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center text-brand-primary"><Mail size={20} /></div>
                    <div>
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mb-1">البريد الإلكتروني</p>
                        <p className="text-brand-dark dark:text-white font-black text-lg" dir="ltr">{supplierInfoModal.email}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setSupplierInfoModal(null)}
                className="w-full py-5 px-6 bg-brand-primary hover:bg-brand-dark text-white rounded-[1.8rem] font-black transition-all active:scale-95 shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-2"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Individual Modal Confirmation */}
      <ConfirmDeleteModal
        isOpen={!!printIndividualModal}
        onClose={() => setPrintIndividualModal(null)}
        onConfirm={() => printIndividualModal && generateIndividualReport(printIndividualModal)}
        title="تصدير كشف حساب فردي"
        description="هل تريد بالتأكيد تصدير كشف حساب والتفاصيل المالية لهذا المورد في ملف PDF مستقل؟"
      />
`;

content = content.replace(/\{\/\* Global Confirmation Modal \*\/\}/, modalsCode + '\n      {/* Global Confirmation Modal */}');

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', content);
