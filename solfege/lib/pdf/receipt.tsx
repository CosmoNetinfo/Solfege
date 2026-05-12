import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Registrazione font (opzionale, ma consigliato per consistenza)
Font.register({
  family: 'Cormorant Garamond',
  src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bm39rK6An6S_yY1N93F-K-F8vXmJ0.ttf',
  fontWeight: 'bold',
});

Font.register({
  family: 'DM Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/dmsans/v14/rP2Fp2ywfy8i6kW5ndpW8DS2.ttf' }, // regular
    { src: 'https://fonts.gstatic.com/s/dmsans/v14/rP2Cp2ywfy8i6kW5ndpW8DS2.ttf', fontWeight: 'bold' }, // bold
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'DM Sans',
    color: '#1A1714',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: 1,
    borderBottomColor: '#E8E4E0',
    paddingBottom: 20,
  },
  schoolInfo: {
    flexDirection: 'column',
  },
  schoolName: {
    fontSize: 24,
    fontFamily: 'Cormorant Garamond',
    fontWeight: 'bold',
    color: '#E8621A',
  },
  schoolDetails: {
    fontSize: 10,
    color: '#7A736C',
    marginTop: 4,
  },
  titleContainer: {
    textAlign: 'right',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  receiptNumber: {
    fontSize: 12,
    marginTop: 4,
    color: '#E8621A',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#7A736C',
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#F4F4F5',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: '#7A736C',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  amountSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#FAFAF9',
    borderRadius: 4,
    border: 1,
    borderColor: '#E8E4E0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8621A',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#7A736C',
    borderTop: 1,
    borderTopColor: '#F4F4F5',
    paddingTop: 10,
  },
});

interface ReceiptData {
  school: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  receiptNumber: string;
  date: Date;
  studentName: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paidDate: Date;
}

export function ReceiptPDF({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{data.school.name}</Text>
            <Text style={styles.schoolDetails}>{data.school.address}</Text>
            <Text style={styles.schoolDetails}>{data.school.phone} | {data.school.email}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Ricevuta</Text>
            <Text style={styles.receiptNumber}>N° {data.receiptNumber}</Text>
            <Text style={styles.schoolDetails}>Data: {format(data.date, 'dd/MM/yyyy')}</Text>
          </View>
        </View>

        {/* Cliente / Allievo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dati Allievo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome e Cognome:</Text>
            <Text style={styles.value}>{data.studentName}</Text>
          </View>
        </View>

        {/* Dettaglio Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dettaglio Pagamento</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Descrizione:</Text>
            <Text style={styles.value}>{data.description}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Metodo di pagamento:</Text>
            <Text style={styles.value}>{data.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data incasso:</Text>
            <Text style={styles.value}>{format(data.paidDate, 'dd/MM/yyyy')}</Text>
          </View>
        </View>

        {/* Importo Totale */}
        <View style={styles.amountSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Importo Totale</Text>
            <Text style={styles.totalValue}>€ {data.amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Documento emesso da {data.school.name} - Solfège SaaS</Text>
        </View>
      </Page>
    </Document>
  );
}
