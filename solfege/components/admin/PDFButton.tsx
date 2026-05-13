'use client';

import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/lib/pdf/receipt";
import { Download } from "lucide-react";

export default function PDFButton({ school, payment }: { school: any, payment: any }) {
  if (!school || !payment) return null;

  return (
    <div className="flex items-center w-full px-2 py-1.5 text-sm outline-none transition-colors hover:bg-stone-100 focus:bg-stone-100 cursor-pointer text-foreground">
      <PDFDownloadLink
        document={
          <ReceiptPDF 
            data={{
              school: {
                name: school.name,
                address: school.address,
                phone: school.phone,
                email: school.email
              },
              receiptNumber: payment.numero_ricevuta,
              date: new Date(),
              studentName: `${payment.students.first_name} ${payment.students.last_name}`,
              description: payment.description || payment.enrollments?.courses?.name || "Corso di musica",
              amount: Number(payment.amount),
              paymentMethod: payment.method || "Bonifico",
              paidDate: new Date(payment.paid_date)
            }} 
          />
        }
        fileName={`Ricevuta_${payment.numero_ricevuta}.pdf`}
        className="flex items-center w-full"
      >
        {({ loading }) => (
          <>
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generazione PDF..." : "Scarica Ricevuta"}
          </>
        )}
      </PDFDownloadLink>
    </div>
  );
}
