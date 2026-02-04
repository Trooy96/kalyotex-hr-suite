import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface PayrollRecord {
  id: string;
  base_salary: number;
  bonuses: number | null;
  deductions: number | null;
  tax: number | null;
  net_pay: number;
  gross_pay?: number | null;
  housing_allowance?: number | null;
  transport_allowance?: number | null;
  lunch_allowance?: number | null;
  other_allowances?: number | null;
  napsa_employee?: number | null;
  nhima_employee?: number | null;
  paye?: number | null;
  payment_status: string | null;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string | null;
  employee: {
    first_name: string | null;
    last_name: string | null;
    position: string | null;
    email?: string;
    department: { name: string } | null;
  } | null;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
}

const defaultCompanyInfo: CompanyInfo = {
  name: "Kalyotex HR System",
  address: "Plot 123 Great East Road, Lusaka, Zambia",
  phone: "+260 211 123 456",
  email: "payroll@kalyotex.co.zm",
  website: "www.kalyotex.co.zm",
  taxId: "TPIN: 1234567890",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
  }).format(amount);
};

export function exportPayrollToPDF(
  records: PayrollRecord[],
  companyInfo: CompanyInfo = defaultCompanyInfo
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Header
  doc.setFillColor(37, 99, 235); // Primary blue
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(companyInfo.address, 14, 28);
  doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, 14, 35);
  if (companyInfo.website) {
    doc.text(`Website: ${companyInfo.website}`, 14, 42);
  }

  // Report Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Payroll Report", 14, 60);

  // Report Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, 14, 68);
  doc.text(`Total Records: ${records.length}`, 14, 75);

  // Summary Statistics
  const totalPayroll = records.reduce((sum, r) => sum + r.net_pay, 0);
  const totalBase = records.reduce((sum, r) => sum + r.base_salary, 0);
  const totalBonuses = records.reduce((sum, r) => sum + (r.bonuses || 0), 0);
  const totalDeductions = records.reduce(
    (sum, r) => sum + (r.deductions || 0) + (r.tax || 0),
    0
  );

  // Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 82, pageWidth - 28, 28, 3, 3, "F");

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Total Base Salary", 22, 92);
  doc.text("Total Bonuses", 72, 92);
  doc.text("Total Deductions", 122, 92);
  doc.text("Net Payroll", 172, 92);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(totalBase), 22, 102);
  doc.setTextColor(34, 197, 94);
  doc.text(formatCurrency(totalBonuses), 72, 102);
  doc.setTextColor(239, 68, 68);
  doc.text(formatCurrency(totalDeductions), 122, 102);
  doc.setTextColor(37, 99, 235);
  doc.text(formatCurrency(totalPayroll), 172, 102);

  // Payroll Table
  const tableData = records.map((record) => {
    const firstName = record.employee?.first_name || "";
    const lastName = record.employee?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim() || "Unknown";

    return [
      fullName,
      record.employee?.position || "N/A",
      record.employee?.department?.name || "N/A",
      `${format(new Date(record.pay_period_start), "MMM d")} - ${format(
        new Date(record.pay_period_end),
        "MMM d, yyyy"
      )}`,
      formatCurrency(record.base_salary),
      formatCurrency(record.bonuses || 0),
      formatCurrency((record.deductions || 0) + (record.tax || 0)),
      formatCurrency(record.net_pay),
      (record.payment_status || "pending").toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: 118,
    head: [
      [
        "Employee",
        "Position",
        "Department",
        "Period",
        "Base Salary",
        "Bonuses",
        "Deductions",
        "Net Pay",
        "Status",
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "right", cellWidth: 18 },
      6: { halign: "right", cellWidth: 20 },
      7: { halign: "right", cellWidth: 20, fontStyle: "bold" },
      8: { halign: "center", cellWidth: 18 },
    },
    didParseCell: function (data) {
      // Color status column
      if (data.section === "body" && data.column.index === 8) {
        const status = data.cell.raw as string;
        if (status === "PAID") {
          data.cell.styles.textColor = [34, 197, 94];
        } else if (status === "PENDING") {
          data.cell.styles.textColor = [234, 179, 8];
        } else if (status === "PROCESSING") {
          data.cell.styles.textColor = [59, 130, 246];
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pageCount} | Confidential - ${companyInfo.name}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `Payroll_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

export function exportIndividualPayslip(
  record: PayrollRecord,
  companyInfo: CompanyInfo = defaultCompanyInfo
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const firstName = record.employee?.first_name || "";
  const lastName = record.employee?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";

  // Company Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(companyInfo.address, 14, 26);
  doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, 14, 33);
  if (companyInfo.taxId) {
    doc.text(companyInfo.taxId, 14, 40);
  }

  // Payslip Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PAYSLIP", 14, 60);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Pay Period: ${format(new Date(record.pay_period_start), "MMMM d")} - ${format(
      new Date(record.pay_period_end),
      "MMMM d, yyyy"
    )}`,
    14,
    68
  );

  // Employee Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 75, pageWidth - 28, 35, 3, 3, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Employee Information", 20, 87);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${fullName}`, 20, 96);
  doc.text(`Position: ${record.employee?.position || "N/A"}`, 20, 103);
  doc.text(`Department: ${record.employee?.department?.name || "N/A"}`, 110, 96);
  doc.text(
    `Payment Date: ${record.payment_date ? format(new Date(record.payment_date), "MMMM d, yyyy") : "Pending"}`,
    110,
    103
  );

  // Earnings Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Earnings", 14, 123);

  const earningsData = [
    ["Base Salary", formatCurrency(record.base_salary)],
  ];
  
  if (record.housing_allowance) {
    earningsData.push(["Housing Allowance", formatCurrency(record.housing_allowance)]);
  }
  if (record.transport_allowance) {
    earningsData.push(["Transport Allowance", formatCurrency(record.transport_allowance)]);
  }
  if (record.lunch_allowance) {
    earningsData.push(["Lunch Allowance", formatCurrency(record.lunch_allowance)]);
  }
  if (record.other_allowances) {
    earningsData.push(["Other Allowances", formatCurrency(record.other_allowances)]);
  }
  if (record.bonuses) {
    earningsData.push(["Bonuses", formatCurrency(record.bonuses)]);
  }

  autoTable(doc, {
    startY: 128,
    head: [["Description", "Amount"]],
    body: earningsData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: "right" } },
    tableWidth: 90,
    margin: { left: 14 },
  });

  // Deductions Section (Statutory)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Statutory Deductions", 110, 123);

  const deductionsData = [];
  if (record.napsa_employee) {
    deductionsData.push(["NAPSA (5%)", formatCurrency(record.napsa_employee)]);
  }
  if (record.nhima_employee) {
    deductionsData.push(["NHIMA (1%)", formatCurrency(record.nhima_employee)]);
  }
  if (record.paye) {
    deductionsData.push(["PAYE", formatCurrency(record.paye)]);
  }
  if (record.deductions && record.deductions > 0) {
    deductionsData.push(["Other Deductions", formatCurrency(record.deductions)]);
  }
  
  if (deductionsData.length === 0) {
    deductionsData.push(["Deductions", formatCurrency(record.deductions || 0)]);
    deductionsData.push(["Tax", formatCurrency(record.tax || 0)]);
  }

  autoTable(doc, {
    startY: 128,
    head: [["Description", "Amount"]],
    body: deductionsData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: "right" } },
    tableWidth: 86,
    margin: { left: 110 },
  });

  // Net Pay
  const grossPay = record.gross_pay || (record.base_salary + (record.bonuses || 0) + 
    (record.housing_allowance || 0) + (record.transport_allowance || 0) + 
    (record.lunch_allowance || 0) + (record.other_allowances || 0));
  const totalDeductions = (record.napsa_employee || 0) + (record.nhima_employee || 0) + 
    (record.paye || 0) + (record.deductions || 0);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, 195, pageWidth - 28, 35, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Gross Pay: ${formatCurrency(grossPay)}`, 20, 207);
  doc.text(`Total Deductions: ${formatCurrency(totalDeductions)}`, 20, 217);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`NET PAY: ${formatCurrency(record.net_pay)}`, 130, 215);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This is a computer-generated document. No signature is required.",
    pageWidth / 2,
    245,
    { align: "center" }
  );
  doc.text(
    `Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`,
    pageWidth / 2,
    251,
    { align: "center" }
  );
  doc.text(`Confidential - ${companyInfo.name}`, pageWidth / 2, 257, {
    align: "center",
  });

  // Save
  const fileName = `Payslip_${fullName.replace(/\s+/g, "_")}_${format(
    new Date(record.pay_period_end),
    "yyyy-MM"
  )}.pdf`;
  doc.save(fileName);
}
