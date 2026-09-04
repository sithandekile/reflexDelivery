import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../socket';
import { RxThickArrowRight } from "react-icons/rx";

export default function DispatcherPage() {
  const [pending, setPending] = useState([]);
  const [riders, setRiders] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const loadInitial = async () => {
    try {
      const [orders, riderList] = await Promise.all([
        api.listDeliveries({ status: 'pending' }),
        api.listUsers('rider'),
      ]);
      setPending(orders);
      setRiders(riderList);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadInitial();

    const socket = getSocket();
    if (!socket) {
      setError('Not connected — please log in again');
      return;
    }

    setConnected(socket.connected);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // A brand-new order, add it straight to the board.
    socket.on('delivery:new', (delivery) => {
      setPending((prev) => [delivery, ...prev]);
    });

    // Another dispatcher (or this one, from a second tab) claimed an order, remove it.
    socket.on('delivery:assigned', ({ delivery_id }) => {
      setPending((prev) => prev.filter((d) => d.id !== delivery_id));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('delivery:new');
      socket.off('delivery:assigned');
    };
  }, []);

  const handleAssign = async (deliveryId, riderId) => {
    try {
      await api.assignRider({ delivery_id: deliveryId, rider_id: riderId });
      /* No need to manually update state here, the delivery:assigned socket
       event (broadcast to all dispatchers, including this one) handles it.*/
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-semibold">Dispatcher Board</h1>
        <span className={`text-xs px-2 py-1 rounded ${connected ? 'bg-lime-400 text-gray-900' : 'bg-red-500'}`}>
          {connected ? 'live' : 'disconnected'}
        </span>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <ul className="space-y-3">
        {pending.map((order) => (
          <li key={order.id} className="p-4 rounded bg-gray-800 border border-gray-700">
            <p className="font-medium flex items-center gap-2">
              {order.pickup_address} <RxThickArrowRight size={20} /> {order.dropoff_address}
            </p>
            {order.package_note && <p className="text-sm text-gray-400">{order.package_note}</p>}
            <div className="mt-2 flex items-center gap-2">
              <select
                className="p-2 rounded bg-gray-900 border border-gray-700"
                onChange={(e) => e.target.value && handleAssign(order.id, e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Assign rider…</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>{rider.name}</option>
                ))}
              </select>
            </div>
          </li>
        ))}
        {pending.length === 0 && <p className="text-gray-400">No pending orders.</p>}
      </ul>
    </div>
  );
}
