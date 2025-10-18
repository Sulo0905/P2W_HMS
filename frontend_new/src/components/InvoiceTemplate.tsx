import React from 'react';

interface InvoiceItem {
    partNumber?: string;
    description: string;
    quantity: number;
    discount?: number;
    price: number;
}

interface InvoiceProps {
    order: {
        invoiceNumber: string;
        customerName: string;
        contactNumber: string;
        paymentMethod: string;
        items: InvoiceItem[];
        subtotal: number;
        total: number;
        amountPaid: number;
        balance: number;
        invoiceDate?: string;
        salesRep?: string;
        location?: string;
        terms?: string;
    };
}

const InvoiceTemplate: React.FC<InvoiceProps> = ({ order }) => {
    const {
        invoiceNumber,
        invoiceDate = new Date().toLocaleDateString(),
        salesRep = 'SHOP',
        location = 'LIYN',
        terms = 'Cash only',
        customerName,
        contactNumber,
        paymentMethod,
        items,
        subtotal,
        total,
        amountPaid,
        balance,
    } = order;

    return (
        <div
            id="invoice-template"
            style={{
                width: '210mm', // A4 width
                minHeight: '297mm', // A4 height
                padding: '15mm',
                margin: '0 auto',
                fontFamily: "'Segoe UI', 'Arial', sans-serif",
                fontSize: '11px',
                lineHeight: '1.4',
                color: '#333',
                backgroundColor: '#fff',
                boxSizing: 'border-box',
                position: 'relative',
            }}
        >
            {/* Header */}
            <header style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '3px solid #e74c3c' }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#e74c3c', margin: '0 0 8px', textTransform: 'uppercase' }}>INDIKA ELECTRICALS</h1>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: '500', marginBottom: '12px' }}>IMPORTERS, DEALERS & WHOLESALE DISTRIBUTORS IN MOTOR ELECTRICAL SPARE PARTS</div>
                    <div style={{ fontSize: '9px', color: '#777', lineHeight: '1.3' }}>
                        <div>Reg. Address: 200, Liyanwala, Padukka</div>
                        <div>Tel: +94-11-2441372 | Fax: +94-11-2309228</div>
                        <div>Email: indikaelectriclas@gmail.com</div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: '600', color: '#2c3e50', textTransform: 'uppercase' }}>INVOICE</div>
            </header>

            {/* Invoice Details */}
            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px', fontSize: '11px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '12px', textTransform: 'uppercase' }}>Invoice Details</h3>
                    <div style={{ display: 'grid', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Sales Rep:</span>
                            <span>{salesRep}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Location:</span>
                            <span>{location}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Terms:</span>
                            <span>{terms}</span>
                        </div>
                    </div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '12px', textTransform: 'uppercase' }}>Invoice Information</h3>
                    <div style={{ display: 'grid', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Invoice Date:</span>
                            <span>{invoiceDate}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Invoice No:</span>
                            <span style={{ color: '#e74c3c' }}>{invoiceNumber}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <thead>
                    <tr style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Part Number</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Disc %</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const discount = item.discount ?? 0;
                        const discountedPrice = item.price * (1 - discount / 100);
                        const amount = discountedPrice * item.quantity;
                        return (
                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                                <td style={{ padding: '8px' }}>{item.partNumber || '-'}</td>
                                <td style={{ padding: '8px' }}>{item.description}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{discount.toFixed(0)}%</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{discountedPrice.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{amount.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Notice */}
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#e74c3c', marginBottom: '20px' }}>GOODS RETURN WILL BE ACCEPTED WITHIN 30 DAYS ONLY (EXCEPT ELECTRICAL ITEMS)</div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
                <div style={{ minWidth: '280px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal:</span>
                        <span>LKR {subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Amount Paid:</span>
                        <span>LKR {amountPaid.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Balance:</span>
                        <span>LKR {balance.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #2c3e50', marginTop: '10px', paddingTop: '10px', fontWeight: '700' }}>
                        <span>Total:</span>
                        <span>LKR {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <section style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div>
                    <strong>Customer:</strong> {customerName}
                </div>
                <div>
                    <strong>Contact:</strong> {contactNumber}
                </div>
                <div>
                    <strong>Payment:</strong> {paymentMethod}
                </div>
            </section>

            {/* Signatures */}
            <footer style={{ borderTop: '1px solid #e9ecef', paddingTop: '20px', fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #ccc', height: '30px' }}></div>Invoiced by
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #ccc', height: '30px' }}></div>Checked by
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #ccc', height: '30px' }}></div>Authorized by
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InvoiceTemplate;
