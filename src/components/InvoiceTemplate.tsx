// components/InvoiceTemplate.tsx
import { Invoice } from '@/types/invoice';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

export function InvoiceTemplate({ invoice }: InvoiceTemplateProps) {
  const calculateTVA = () => {
    return invoice.montant_ttc - invoice.montant_ht;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div id="invoice-template" className="bg-white p-8 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex justify-between items-start border-b-2 border-green-600 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-green-800">FACTURE</h1>
          <p className="text-gray-600 mt-2">Numéro: {invoice.numero}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold text-gray-800">{invoice.clinique.nom}</h2>
          <p className="text-gray-600">Votre partenaire santé</p>
        </div>
      </div>

      {/* Informations client et facture */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-3">FACTURÉ À</h3>
          <p className="font-medium">{invoice.patient.firstname} {invoice.patient.lastname}</p>
          <p className="text-gray-600">{invoice.patient.email}</p>
          <p className="text-gray-600">Patient</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">DÉTAILS FACTURE</h3>
          <div className="space-y-1">
            <p><span className="font-medium">Date émission:</span> {formatDate(invoice.date_emission)}</p>
            {invoice.date_echeance && (
              <p><span className="font-medium">Date échéance:</span> {formatDate(invoice.date_echeance)}</p>
            )}
            <p><span className="font-medium">Statut:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                invoice.status === 'PAYEE' ? 'bg-green-100 text-green-800' :
                invoice.status === 'EMISE' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {invoice.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {invoice.description && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
          <p className="text-gray-600">{invoice.description}</p>
        </div>
      )}

      {/* Tableau des articles */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-800 mb-4">PRESTATIONS MÉDICALES</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-center p-3 font-semibold">Quantité</th>
                <th className="text-right p-3 font-semibold">Prix HT</th>
                <th className="text-right p-3 font-semibold">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3 border-b">{item.description}</td>
                    <td className="p-3 border-b text-center">{item.quantite}</td>
                    <td className="p-3 border-b text-right">{item.prix_unitaire_ht.toFixed(2)} €</td>
                    <td className="p-3 border-b text-right">
                      {(item.quantite * item.prix_unitaire_ht).toFixed(2)} €
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border-b">Consultation médicale</td>
                  <td className="p-3 border-b text-center">1</td>
                  <td className="p-3 border-b text-right">{invoice.montant_ht.toFixed(2)} €</td>
                  <td className="p-3 border-b text-right">{invoice.montant_ht.toFixed(2)} €</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totaux */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
        <div className="max-w-md ml-auto space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">Sous-total HT:</span>
            <span>{invoice.montant_ht.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">TVA ({invoice.tva}%):</span>
            <span>{calculateTVA().toFixed(2)} €</span>
          </div>
          <div className="flex justify-between pt-3 border-t-2 border-green-300">
            <span className="font-bold text-lg">Total TTC:</span>
            <span className="font-bold text-lg text-green-700">{invoice.montant_ttc.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Mentions légales */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>Facture établie électroniquement - Valable sans signature</p>
          <p className="mt-1">En cas de question, contactez le secrétariat de la clinique</p>
          <p className="mt-1">Conserver ce document pendant 10 ans</p>
        </div>
      </div>
    </div>
  );
}