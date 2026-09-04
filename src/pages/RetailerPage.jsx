import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../socket';
import { RxThickArrowRight } from "react-icons/rx";


export default function RetailerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
     pickup_address: '',
     dropoff_address: '',
     package_note: ''
    });
  

  const loadOrders = async () => {
    try {
      setOrders(await api.listDeliveries());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadOrders();

    const socket = getSocket();
    if (!socket) return;

    /* Live status updates for this retailer's own orders (server only emits
    to this retailer's `user:<id>` room, so no filtering needed here).*/
    socket.on('delivery:status', ({ delivery_id, status }) => {
      setOrders((prev) => prev.map((o) => (o.id === delivery_id ? { ...o, status } : o)));
    });

    return () => socket.off('delivery:status');
  }, []);

  const handleChange=(e)=>{
    setForm({...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createDelivery(form);
      setForm({ pickup_address: '', dropoff_address: '', package_note: '' });
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-semibold mb-4">Retailer New Delivery</h1>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-md mb-8">
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Pickup address"
          name="pickup_address"
          value={form.pickup_address}
          onChange={handleChange}
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Dropoff address"
          name='dropoff_address'
          value={form.dropoff_address}
          onChange={handleChange}
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Package note (optional)"
          name="package_note"
          value={form.package_note}
          onChange={handleChange}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-lime-400 text-gray-900 font-medium disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Delivery'}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      <h2 className="text-lg font-medium mb-2">These Are Your Orders</h2>
      <ul className="space-y-2">
        {orders.map((order) => (
          <li key={order.id} className="p-3 rounded bg-gray-800 border border-gray-700">
            <p className="font-medium">{order.pickup_address} <RxThickArrowRight/>{order.dropoff_address}</p>
            <p className="text-sm text-lime-400">{order.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
