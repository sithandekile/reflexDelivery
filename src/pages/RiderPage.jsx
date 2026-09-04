import React,{ useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../socket';
import { RxThickArrowRight } from "react-icons/rx";

const NEXT_STATUS = {
  assigned: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

export default function RiderPage() {
  const [deliveryId, setDeliveryId] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const loadDelivery = async (id) => {
    try {
      const result = await api.getDelivery(id);
      setDelivery(result);
      setDeliveryId(String(id));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadAssignedDeliveries = async () => {
    try {
      const rows = await api.listDeliveries();
      setAssignedDeliveries(rows || []);
      if (rows?.length) {
        const latest = rows[0];
        await loadDelivery(latest.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAssignedDeliveries();

    const socket = getSocket();
    if (!socket) return;

    /* Server emits this only to the assigned rider's own room —
     no need to check whose assignment it is.*/
    socket.on('assignment:new', async ({ delivery_id }) => {
      const id = String(delivery_id);
      setNotice(`New delivery assigned: ${id}`);
      await loadDelivery(id);
      await loadAssignedDeliveries();
    });

    return () => socket.off('assignment:new');
  }, []);

  const handleAdvance = async () => {
    const next = NEXT_STATUS[delivery.status];
    if (!next) return;
    try {
      await api.updateStatus(delivery.id, { status: next });
      await loadDelivery(delivery.id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-semibold mb-4">Rider</h1>

      {notice && (
        <div className="mb-4 p-3 rounded bg-lime-400 text-gray-900 text-sm">
          {notice}
        </div>
      )}

      <div className="flex gap-2 mb-6 max-w-md">
        <input
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Delivery ID"
          value={deliveryId}
          onChange={(e) => setDeliveryId(e.target.value)}
        />
        <button
          onClick={() => loadDelivery(deliveryId)}
          className="px-4 py-2 rounded bg-lime-400 text-gray-900 font-medium"
        >
          Load
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {assignedDeliveries.length > 0 && (
        <div className="mb-6 max-w-md">
          <p className="text-sm text-gray-400 mb-2">Assigned deliveries</p>
          <div className="space-y-2">
            {assignedDeliveries.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadDelivery(item.id)}
                className={`w-full text-left p-3 rounded border ${delivery?.id === item.id ? 'border-lime-400 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}
              >
                <div className="text-sm text-lime-400">{item.id}</div>
                <div className="text-sm">{item.pickup_address} <RxThickArrowRight /> {item.dropoff_address}</div>
                <div className="text-xs text-gray-400">Status: {item.status}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {delivery && (
        <div className="p-4 rounded bg-gray-800 border border-gray-700 max-w-md">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Selected delivery</p>
          <p className="font-medium text-sm mb-1">ID: {delivery.id}</p>
          <p className="font-medium">{delivery.pickup_address} <RxThickArrowRight /> {delivery.dropoff_address}</p>
          <p className="text-sm text-lime-400 mb-3">Status: {delivery.status}</p>
          {NEXT_STATUS[delivery.status] && (
            <button
              onClick={handleAdvance}
              className="px-4 py-2 rounded bg-lime-400 text-gray-900 font-medium"
            >
              Mark as {NEXT_STATUS[delivery.status]}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
