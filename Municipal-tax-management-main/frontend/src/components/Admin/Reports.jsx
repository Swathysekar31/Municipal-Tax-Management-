import React, { useEffect, useMemo, useState } from 'react';
import API from '../../utils/api';
import { jsPDF } from 'jspdf';

const Section = ({ title, columns, rows }) => {
    return (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{title} ({rows.length})</h3>
                <button
                    onClick={() => {
                        const header = columns.map(c => c.header).join(',');
                        const body = rows.map(r => columns.map(c => (r[c.key] ?? '')).join(',')).join('\n');
                        const csv = header + '\n' + body;
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = title.replace(/\s+/g, '_').toLowerCase() + '.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#f8fafc', cursor: 'pointer' }}
                >Export CSV</button>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #eee', background: '#fafafa', fontWeight: 600 }}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                {columns.map(col => (
                                    <td key={col.key} style={{ padding: '10px 8px' }}>{row[col.key]}</td>
                                ))}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>No records</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Reports = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('property');

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await API.get('/admin/tax-report');
                if (mounted) {
                    setReport(res.data);
                    setLoading(false);
                }
            } catch (e) {
                if (mounted) {
                    setError(e?.response?.data?.message || 'Failed to load report');
                    setLoading(false);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    const columns = useMemo(() => ([
        { key: 'customer_id', header: 'Customer ID' },
        { key: 'name', header: 'Name' },
        { key: 'phone_number', header: 'Phone' },
        { key: 'door_no', header: 'Door No' },
        { key: 'ward_no', header: 'Ward No' }
    ]), []);

    if (loading) return <div>Loading report...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!report) return null;

    const downloadPDF = () => {
        const doc = new jsPDF();
        let y = 12;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Tax Payment Report', 105, y, { align: 'center' });
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const date = new Date().toLocaleString();
        doc.text(`Generated: ${date}`, 105, y, { align: 'center' });
        y += 10;

        const renderTable = (title, rows) => {
            if (y > 260) { doc.addPage(); y = 14; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(title + ` (${rows.length})`, 14, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const headers = ['Customer ID', 'Name', 'Phone', 'Door', 'Ward'];
            const colX = [14, 54, 114, 154, 174];
            headers.forEach((h, i) => doc.text(h, colX[i], y));
            y += 4;
            doc.setDrawColor(220);
            doc.line(14, y, 196, y);
            y += 4;
            rows.forEach(r => {
                if (y > 280) { doc.addPage(); y = 14; }
                const vals = [r.customer_id, r.name, r.phone_number, r.door_no, r.ward_no];
                vals.forEach((v, i) => doc.text(String(v || ''), colX[i], y));
                y += 5;
            });
            y += 4;
        };

        if (tab === 'property') {
            renderTable('Property Tax - Paid', report.property.paid);
            renderTable('Property Tax - Not Paid', report.property.notPaid);
        } else {
            renderTable('Water Tax - Paid', report.water.paid);
            renderTable('Water Tax - Partial', report.water.partial);
            renderTable('Water Tax - Not Paid', report.water.notPaid);
        }

        doc.save(`tax_report_${tab}_${Date.now()}.pdf`);
    };

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setTab('property')} className={tab === 'property' ? 'active' : ''} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: tab === 'property' ? '#e0f2fe' : '#fff', cursor: 'pointer' }}>Property Tax</button>
                    <button onClick={() => setTab('water')} className={tab === 'water' ? 'active' : ''} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: tab === 'water' ? '#e0f2fe' : '#fff', cursor: 'pointer' }}>Water Tax</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={downloadPDF} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Download PDF</button>
                </div>
            </div>
            {tab === 'property' ? (
                <div style={{ display: 'grid', gap: 16 }}>
                    <Section title="Property Tax - Paid" columns={columns} rows={report.property.paid} />
                    <Section title="Property Tax - Not Paid" columns={columns} rows={report.property.notPaid} />
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    <Section title="Water Tax - Paid" columns={columns} rows={report.water.paid} />
                    <Section title="Water Tax - Partial" columns={columns} rows={report.water.partial} />
                    <Section title="Water Tax - Not Paid" columns={columns} rows={report.water.notPaid} />
                </div>
            )}
        </div>
    );
};

export default Reports;


