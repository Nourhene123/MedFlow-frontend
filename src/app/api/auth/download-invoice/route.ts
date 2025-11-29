// src/app/api/auth/download-invoice/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Route appelée - version contournement IDM');
    
    const { invoiceId, invoiceNumber } = await request.json();
    const authHeader = request.headers.get('authorization');

    console.log('Données:', { invoiceId, invoiceNumber });

    if (!authHeader || !invoiceId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Appel à Django
    const djangoResponse = await fetch(
      `${API_BASE}/api/invoices/${invoiceId}/download/`,
      {
        headers: { 'Authorization': authHeader },
      }
    );

    console.log('Status Django:', djangoResponse.status);

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { error: `Erreur Django: ${djangoResponse.status}` },
        { status: djangoResponse.status }
      );
    }

    const pdfBuffer = await djangoResponse.arrayBuffer();
    
    if (pdfBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'PDF vide' }, { status: 500 });
    }

    console.log('PDF reçu:', pdfBuffer.byteLength, 'bytes');

    // ✅ CONTOURNEMENT IDM : Retourner une URL de données au lieu du PDF direct
    const base64 = Buffer.from(pdfBuffer).toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUrl: dataUrl,
      fileName: `facture-${invoiceNumber}.pdf`,
      size: pdfBuffer.byteLength
    });

  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}