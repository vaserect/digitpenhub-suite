'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Printer,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Truck,
  FileText,
  Layers,
  Settings,
  MapPin,
  Image,
  Search,
  ArrowLeft,
  ExternalLink,
  Plus
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

export default function PrintFulfillment() {
  const { user } = useAuth();
  
  // Navigation / Tabs State
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'orders' | 'analytics'
  const [loading, setLoading] = useState(true);

  // Print Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_orders: 0,
    total_spend: 0,
    total_delivered: 0,
    total_in_production: 0,
    total_shipped: 0
  });

  // Ordering Configurations States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderSpecs, setOrderSpecs] = useState({});
  const [artworkSource, setArtworkSource] = useState('url'); // 'url' | 'digital_card'
  const [artworkUrl, setArtworkUrl] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    to_name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes, analyticsRes] = await Promise.all([
        apiFetch('/api/v1/print-fulfillment/catalog'),
        apiFetch('/api/v1/print-fulfillment/orders'),
        apiFetch('/api/v1/print-fulfillment/analytics')
      ]);

      if (productsRes.success) setProducts(productsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error loading print fulfillment data:', error);
      toast.error('Failed to load printing catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle click on product to configure order
  const handleConfigureProduct = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(product.spec_options.quantities[0]);
    // Set default specs
    const defaultSpecs = {};
    if (product.spec_options.sizes) defaultSpecs.size = product.spec_options.sizes[0];
    if (product.spec_options.paper_stocks) defaultSpecs.paper_stock = product.spec_options.paper_stocks[0];
    if (product.spec_options.finishes) defaultSpecs.finish = product.spec_options.finishes[0];
    setOrderSpecs(defaultSpecs);
    setArtworkUrl('');
    setIsOrderModalOpen(true);
  };

  // Instant Quote Cost Calculation
  const quoteCost = useMemo(() => {
    if (!selectedProduct) return { basePrice: 0, shippingCost: 0, total: 0 };
    const basePrice = parseFloat(selectedProduct.base_price);
    
    // Shipping cost map
    let shippingCost = 4.99;
    if (shippingMethod === 'express') shippingCost = 14.99;
    else if (shippingMethod === 'overnight') shippingCost = 29.99;

    const total = basePrice + shippingCost;
    return {
      basePrice,
      shippingCost,
      total
    };
  }, [selectedProduct, shippingMethod]);

  // Load Artwork design from platform stubs (simulate Digital Card connection)
  const handleLoadDigitalCard = () => {
    setArtworkUrl('https://cdn.digitpenhub.com/designs/digital-card-artwork-standard.pdf');
    toast.success('Successfully loaded artwork layout from Digital Business Cards module.');
  };

  // Handle Order Submit Transaction
  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (!artworkUrl.trim()) {
      toast.error('Artwork URL or layout file path is required.');
      return;
    }

    try {
      const res = await apiFetch('/api/v1/print-fulfillment/orders', {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedProduct.id,
          quantity: parseInt(orderQuantity),
          specs: orderSpecs,
          artwork_url: artworkUrl,
          shipping_address: shippingAddress,
          shipping_method: shippingMethod,
          shipping_cost: quoteCost.shippingCost,
          total_price: quoteCost.total
        })
      });

      if (res.success) {
        toast.success('Print order placed successfully!');
        setIsOrderModalOpen(false);
        setShippingAddress({
          to_name: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          zip: '',
          country: 'US'
        });
        await loadData();
        setActiveTab('orders');
      }
    } catch (error) {
      toast.error(error.message || 'Print ordering transaction failed.');
    }
  };

  // Simulate Order Production Phase Advancement (sandbox callback testing)
  const handleSimulateStatusAdvance = async (id) => {
    try {
      const res = await apiFetch(`/api/v1/print-fulfillment/orders/${id}/simulate`, { method: 'PUT' });
      if (res.success) {
        toast.success(`Print order status advanced to: ${res.data.status}`);
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Simulation transition error.');
    }
  };

  // Status Badge Styling Helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'printing': return 'warning';
      case 'proofing': return 'info';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  // Tracking Progress Value Width Helper
  const getProgressWidth = (status) => {
    switch (status) {
      case 'delivered': return '100%';
      case 'shipped': return '75%';
      case 'printing': return '50%';
      case 'proofing': return '25%';
      case 'ordered': return '10%';
      default: return '0%';
    }
  };

  return (
    <div className="panel">
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🖨️</span> Print-on-Demand Fulfillment
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Order professional business cards and signage directly. Custom sizing, paper stock finishes, and tracking logs.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'catalog' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'catalog' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Product Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Fulfillment Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Fulfillment Analytics
          </button>
        </div>
      </div>

      {/* Tab: Catalog Grid */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {products.map((prod) => (
            <div key={prod.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Badge type="info">{prod.category.replace('_', ' ').toUpperCase()}</Badge>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                    From ${parseFloat(prod.base_price).toFixed(2)}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{prod.name}</h3>
                <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineBreak: 'anywhere' }}>{prod.description}</p>
                
                {/* Seeded spec previews */}
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {prod.spec_options.paper_stocks?.slice(0, 2).map((s, idx) => (
                    <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--surface-muted)', borderRadius: 4, color: 'var(--text-muted)' }}>
                      {s}
                    </span>
                  ))}
                  {prod.spec_options.finishes?.slice(0, 2).map((f, idx) => (
                    <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--surface-muted)', borderRadius: 4, color: 'var(--text-muted)' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <Button onClick={() => handleConfigureProduct(prod)} style={{ width: '100%', marginTop: 8 }}>
                Select & Configure Specs
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Order History */}
      {activeTab === 'orders' && (
        <>
          {orders.length === 0 ? (
            <EmptyState
              title="No print orders placed"
              description="Configure specifications and order marketing flyers, business cards or vinyl signage to list tracking details here."
            />
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>Print Order Ref</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Product & Specs</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Qty Ordered</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Artwork File</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Total Price</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Fulfillment Status</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Test Sandbox</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 600 }}>{ord.provider_order_id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          To: {ord.shipping_address.to_name} ({ord.shipping_address.city}, {ord.shipping_address.state})
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 500 }}>{ord.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {Object.entries(ord.specs).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(' | ')}
                        </div>
                      </td>
                      <td style={{ padding: 12, fontWeight: 500 }}>{ord.quantity} units</td>
                      <td style={{ padding: 12 }}>
                        <a href={ord.artwork_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Download <ExternalLink size={12} />
                        </a>
                      </td>
                      <td style={{ padding: 12, fontWeight: 600 }}>${parseFloat(ord.total_price).toFixed(2)}</td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Badge type={getStatusColor(ord.status)}>{ord.status.toUpperCase()}</Badge>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ord.status_details}</span>
                          
                          {/* Visual production timeline */}
                          {ord.status !== 'cancelled' && (
                            <div style={{ width: 120, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                              <div style={{ height: '100%', background: 'var(--primary)', width: getProgressWidth(ord.status), transition: 'width 0.3s' }} />
                            </div>
                          )}
                          
                          {ord.tracking_number && (
                            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                              {ord.tracking_carrier}: {ord.tracking_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {ord.status !== 'delivered' && ord.status !== 'cancelled' ? (
                          <Button variant="secondary" onClick={() => handleSimulateStatusAdvance(ord.id)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                            Next Step
                          </Button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab: Analytics spend logs */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600 }}>Operational Print Summary</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fulfillment Orders placed</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{analytics.total_orders || 0} Jobs</div>
              </div>
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spent (Fulfillment)</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>${parseFloat(analytics.total_spend).toFixed(2)}</div>
              </div>
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirmed Deliveries</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{analytics.total_delivered || 0} Shipments</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: 'var(--primary)' }} /> Live Production Pipeline Statuses
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span>In Production (Proofing/Printing)</span>
                  <span style={{ fontWeight: 600 }}>{analytics.total_in_production || 0} Orders</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--warning)', width: `${(analytics.total_in_production / (analytics.total_orders || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span>Shipped (In Transit FedEx)</span>
                  <span style={{ fontWeight: 600 }}>{analytics.total_shipped || 0} Orders</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--info)', width: `${(analytics.total_shipped / (analytics.total_orders || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span>Delivered Successfully</span>
                  <span style={{ fontWeight: 600 }}>{analytics.total_delivered || 0} Orders</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--success)', width: `${(analytics.total_delivered / (analytics.total_orders || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE & ORDER PRODUCT */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={`Configure: ${selectedProduct?.name}`}>
        <form onSubmit={handlePlaceOrderSubmit} style={{ display: 'grid', gap: 16 }}>
          
          {/* Sizing & stock specs selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {selectedProduct?.spec_options.paper_stocks && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Paper Stock Weight</label>
                <select
                  value={orderSpecs.paper_stock || ''}
                  onChange={e => setOrderSpecs({ ...orderSpecs, paper_stock: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                >
                  {selectedProduct.spec_options.paper_stocks.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {selectedProduct?.spec_options.finishes && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Finish Option</label>
                <select
                  value={orderSpecs.finish || ''}
                  onChange={e => setOrderSpecs({ ...orderSpecs, finish: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                >
                  {selectedProduct.spec_options.finishes.map((f, i) => <option key={i} value={f}>{f}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {selectedProduct?.spec_options.quantities && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Print Quantity</label>
                <select
                  value={orderQuantity}
                  onChange={e => setOrderQuantity(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                >
                  {selectedProduct.spec_options.quantities.map((q, i) => <option key={i} value={q}>{q} units</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Shipping Method</label>
              <select
                value={shippingMethod}
                onChange={e => setShippingMethod(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="standard">Standard Ground ($4.99)</option>
                <option value="express">FedEx Express ($14.99)</option>
                <option value="overnight">FedEx Overnight ($29.99)</option>
              </select>
            </div>
          </div>

          {/* Artwork upload details */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Image size={16} /> Link Artwork File (PDF/Image)
            </h4>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="radio" checked={artworkSource === 'url'} onChange={() => setArtworkSource('url')} /> Specify URL
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="radio" checked={artworkSource === 'digital_card'} onChange={() => setArtworkSource('digital_card')} /> Connect Digital Card Design
              </label>
            </div>
            
            {artworkSource === 'url' ? (
              <input
                type="url"
                required
                placeholder="e.g. https://domain.com/artwork.pdf"
                value={artworkUrl}
                onChange={e => setArtworkUrl(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  placeholder="No digital card layout attached"
                  value={artworkUrl}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-muted)', fontSize: '0.875rem', color: 'var(--text-muted)' }}
                />
                <Button variant="secondary" onClick={handleLoadDigitalCard} style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                  Load Layout
                </Button>
              </div>
            )}
          </div>

          {/* Shipping fields */}
          <h4 style={{ margin: '8px 0 0', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>Shipping Address</h4>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Recipient Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corp (Attn: Delivery)"
              value={shippingAddress.to_name}
              onChange={e => setShippingAddress({ ...shippingAddress, to_name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Street Address</label>
            <input
              type="text"
              required
              placeholder="e.g. 789 Maple Rd"
              value={shippingAddress.line1}
              onChange={e => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>City</label>
              <input
                type="text"
                required
                placeholder="e.g. Seattle"
                value={shippingAddress.city}
                onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>State</label>
              <input
                type="text"
                required
                placeholder="e.g. WA"
                value={shippingAddress.state}
                onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>ZIP</label>
              <input
                type="text"
                required
                placeholder="e.g. 98101"
                value={shippingAddress.zip}
                onChange={e => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Pricing quotes display */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8, display: 'grid', gap: 6, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Product Base Price:</span>
              <span>${quoteCost.basePrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>FedEx Shipping ({shippingMethod}):</span>
              <span>${quoteCost.shippingCost.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span>Instant Fulfillment Quote:</span>
              <span style={{ color: 'var(--primary)' }}>${quoteCost.total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsOrderModalOpen(false)}>Cancel</Button>
            <Button type="submit">Place Printing Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
