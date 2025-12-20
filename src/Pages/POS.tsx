import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Scan,
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  CreditCard,
  DollarSign,
  Smartphone,
  Receipt,
  X,
} from 'lucide-react';

interface CartItem {
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total: number;
}

interface Item {
  id: string;
  barcode: string | null;
  name: string;
  selling_price: number;
  tax_rate: number;
  discount_rate: number;
  inventory: { quantity: number }[];
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  credit_balance: number;
}

export default function POS() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadItems();
    loadCustomers();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, inventory(quantity)')
        .eq('is_active', true);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const item = items.find((i) => i.barcode === barcodeInput.trim());
    if (item) {
      addToCart(item);
      setBarcodeInput('');
    } else {
      alert('Item not found');
      setBarcodeInput('');
    }
  };

  const addToCart = (item: Item) => {
    const existingItem = cart.find((ci) => ci.item_id === item.id);

    if (existingItem) {
      updateQuantity(existingItem.item_id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        item_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: item.selling_price,
        tax_rate: item.tax_rate,
        discount_rate: item.discount_rate,
        total: calculateItemTotal(item.selling_price, 1, item.tax_rate, item.discount_rate),
      };
      setCart([...cart, newItem]);
    }
    setShowItemSearch(false);
    setSearchTerm('');
  };

  const calculateItemTotal = (
    price: number,
    qty: number,
    taxRate: number,
    discountRate: number
  ) => {
    const subtotal = price * qty;
    const discount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * taxRate) / 100;
    return afterDiscount + tax;
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty < 1) return;

    setCart(
      cart.map((item) =>
        item.item_id === itemId
          ? {
              ...item,
              quantity: newQty,
              total: calculateItemTotal(
                item.unit_price,
                newQty,
                item.tax_rate,
                item.discount_rate
              ),
            }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.item_id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const itemSubtotal = item.unit_price * item.quantity;
      const discount = (itemSubtotal * item.discount_rate) / 100;
      return sum + (itemSubtotal - discount);
    }, 0);

    const taxAmount = cart.reduce((sum, item) => {
      const itemSubtotal = item.unit_price * item.quantity;
      const discount = (itemSubtotal * item.discount_rate) / 100;
      const afterDiscount = itemSubtotal - discount;
      return sum + (afterDiscount * item.tax_rate) / 100;
    }, 0);

    const discountAmount = cart.reduce((sum, item) => {
      const itemSubtotal = item.unit_price * item.quantity;
      return sum + (itemSubtotal * item.discount_rate) / 100;
    }, 0);

    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, discountAmount, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const totals = calculateTotals();
    const paid = parseFloat(amountPaid) || 0;

    if (paymentMethod !== 'credit' && paid < totals.total) {
      alert('Insufficient payment amount');
      return;
    }

    setProcessing(true);

    try {
      const staffRecord = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', profile?.id)
        .maybeSingle();

      const saleNumber = `SALE-${Date.now()}`;

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            sale_number: saleNumber,
            customer_id: selectedCustomer?.id || null,
            staff_id: staffRecord.data?.id || null,
            subtotal: totals.subtotal,
            tax_amount: totals.taxAmount,
            discount_amount: totals.discountAmount,
            total_amount: totals.total,
            status: 'completed',
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_rate: item.discount_rate,
        total: item.total,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

      if (itemsError) throw itemsError;

      const { error: paymentError } = await supabase.from('payments').insert([
        {
          sale_id: sale.id,
          payment_method: paymentMethod,
          amount: paymentMethod === 'credit' ? 0 : paid,
          status: 'completed',
        },
      ]);

      if (paymentError) throw paymentError;

      const receiptNumber = `RCP-${Date.now()}`;
      const { error: receiptError } = await supabase.from('receipts').insert([
        {
          sale_id: sale.id,
          receipt_number: receiptNumber,
        },
      ]);

      if (receiptError) throw receiptError;

      for (const item of cart) {
        const currentInventory = await supabase
          .from('inventory')
          .select('quantity')
          .eq('item_id', item.item_id)
          .single();

        if (currentInventory.data) {
          await supabase
            .from('inventory')
            .update({
              quantity: currentInventory.data.quantity - item.quantity,
              last_updated: new Date().toISOString(),
            })
            .eq('item_id', item.item_id);

          await supabase.from('stock_movements').insert([
            {
              item_id: item.item_id,
              type: 'sale',
              quantity: -item.quantity,
              reference_id: sale.id,
            },
          ]);
        }
      }

      if (selectedCustomer) {
        await supabase
          .from('customers')
          .update({
            total_purchases:
              selectedCustomer.credit_balance + totals.total,
          })
          .eq('id', selectedCustomer.id);

        if (paymentMethod === 'credit') {
          await supabase
            .from('customers')
            .update({
              credit_balance: selectedCustomer.credit_balance + totals.total,
            })
            .eq('id', selectedCustomer.id);

          await supabase.from('credit_transactions').insert([
            {
              customer_id: selectedCustomer.id,
              type: 'credit',
              amount: totals.total,
              reference_id: sale.id,
              description: `Sale ${saleNumber}`,
              balance_after: selectedCustomer.credit_balance + totals.total,
            },
          ]);
        }
      }

      alert(`Sale completed successfully!\nReceipt: ${receiptNumber}\nChange: $${(paid - totals.total).toFixed(2)}`);

      setCart([]);
      setSelectedCustomer(null);
      setShowPayment(false);
      setAmountPaid('');
      setPaymentMethod('cash');
      loadItems();
      loadCustomers();
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale');
    } finally {
      setProcessing(false);
    }
  };

  const totals = calculateTotals();
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600 mt-1">Process sales and manage transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or enter barcode (F2)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowItemSearch(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Browse
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Cart Items</h2>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ${item.unit_price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="w-20 text-right font-medium">
                        ${item.total.toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.item_id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Customer</h2>
            {selectedCustomer ? (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Credit: ${selectedCustomer.credit_balance.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerSearch(true)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Select Customer
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">
                  -${totals.discountAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-gray-900">${totals.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              <CreditCard className="w-5 h-5" />
              Checkout
            </button>
          </div>
        </div>
      </div>

      {showItemSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Select Item</h2>
              <button
                onClick={() => {
                  setShowItemSearch(false);
                  setSearchTerm('');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Stock: {item.inventory[0]?.quantity || 0}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      ${item.selling_price.toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Select Customer</h2>
              <button
                onClick={() => {
                  setShowCustomerSearch(false);
                  setSearchTerm('');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerSearch(false);
                    setSearchTerm('');
                  }}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ${totals.total.toFixed(2)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: DollarSign },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'mobile', label: 'Mobile', icon: Smartphone },
                    { id: 'credit', label: 'Credit', icon: User },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                          paymentMethod === method.id
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod !== 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="0.00"
                    autoFocus
                  />
                  {amountPaid && parseFloat(amountPaid) >= totals.total && (
                    <p className="mt-2 text-sm text-green-600">
                      Change: ${(parseFloat(amountPaid) - totals.total).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {processing ? 'Processing...' : 'Complete Sale'}
                </button>
                <button
                  onClick={() => {
                    setShowPayment(false);
                    setAmountPaid('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
