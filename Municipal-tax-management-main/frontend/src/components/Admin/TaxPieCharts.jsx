import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

const Pie = ({ paid, notPaid, partial = 0, title, colors }) => {
    const total = paid + notPaid + partial;
    const paidPct = total ? (paid / total) * 100 : 0;
    const partialPct = total ? (partial / total) * 100 : 0;
    const notPaidPct = total ? (notPaid / total) * 100 : 0;

    const stroke = 32;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    const paidLen = (paidPct / 100) * circumference;
    const partialLen = (partialPct / 100) * circumference;
    const notPaidLen = (notPaidPct / 100) * circumference;

    let offsetStart = -circumference / 4; // start at 12 o'clock

    const [hover, setHover] = React.useState(null);
    const containerRef = React.useRef(null);
    const [tooltip, setTooltip] = React.useState({ show: false, x: 0, y: 0, text: '' });

    const handleMove = (e, label, pct) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setTooltip({ show: true, x, y, text: `${label}: ${pct.toFixed(1)}%` });
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width={160} height={160} viewBox="0 0 160 160">
                <g transform="translate(70,70)">
                    <circle r={radius} fill="#f7f7f7" />
                    {/* Paid */}
                    <circle r={radius} fill="transparent" stroke={colors.paid} strokeWidth={stroke}
                        strokeDasharray={`${paidLen} ${circumference - paidLen}`}
                        strokeDashoffset={offsetStart}
                        strokeLinecap="butt"
                        onMouseMove={(e) => handleMove(e, 'Paid', paidPct)}
                        onMouseEnter={() => setHover('paid')}
                        onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, text: '' })}
                    />
                    {/* Partial */}
                    <circle r={radius} fill="transparent" stroke={colors.partial}
                        strokeWidth={stroke}
                        strokeDasharray={`${partialLen} ${circumference - partialLen}`}
                        strokeDashoffset={offsetStart - paidLen}
                        strokeLinecap="butt"
                        onMouseMove={(e) => handleMove(e, 'Partial', partialPct)}
                        onMouseEnter={() => setHover('partial')}
                        onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, text: '' })}
                    />
                    {/* Not Paid */}
                    <circle r={radius} fill="transparent" stroke={colors.notPaid}
                        strokeWidth={stroke}
                        strokeDasharray={`${notPaidLen} ${circumference - notPaidLen}`}
                        strokeDashoffset={offsetStart - paidLen - partialLen}
                        strokeLinecap="butt"
                        onMouseMove={(e) => handleMove(e, 'Not paid', notPaidPct)}
                        onMouseEnter={() => setHover('notPaid')}
                        onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, text: '' })}
                    />
                    <circle r={radius - stroke/2} fill="white" />
                </g>
            </svg>
            <div style={{ fontWeight: '600', marginTop: 8 }}>{title}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, marginTop: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, background: colors.paid, display: 'inline-block', borderRadius: 2 }} /> Paid: {paid}
                </span>
                {partial > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, background: colors.partial, display: 'inline-block', borderRadius: 2 }} /> Partial: {partial}
                    </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, background: colors.notPaid, display: 'inline-block', borderRadius: 2 }} /> Not paid: {notPaid}
                </span>
            </div>
            {tooltip.show && (
    <div
        style={{
            position: 'absolute',
            left: tooltip.x + 6,
            top: tooltip.y - 6,
            background: 'rgba(255, 255, 255, 0.1)', // light transparent background
            color: '#00FFFF', // bright cyan text
            padding: '6px 8px',
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(0,255,255,0.4)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            zIndex: 10,
            fontWeight: 600,
        }}
    >
        {tooltip.text}
    </div>
)}

        </div>
    );
};

const TaxPieCharts = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await API.get('/admin/tax-status-summary');
                if (mounted) {
                    setData(res.data);
                    setLoading(false);
                }
            } catch (e) {
                if (mounted) {
                    setError(e?.response?.data?.message || 'Failed to load charts');
                    setLoading(false);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    if (loading) return <div>Loading chart...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!data) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                <Pie
                    title="Property Tax"
                    paid={data.property.paid}
                    partial={0}
                    notPaid={data.property.notPaid}
                    colors={{ paid: '#16a34a', partial: '#f59e0b', notPaid: '#ef4444' }}
                />
            </div>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                <Pie
                    title="Water Tax"
                    paid={data.water.paid}
                    partial={data.water.partial}
                    notPaid={data.water.notPaid}
                    colors={{ paid: '#2563eb', partial: '#f59e0b', notPaid: '#ef4444' }}
                />
            </div>
        </div>
    );
};

export default TaxPieCharts;


