import supabase from'../db/supabaseClient.js';
import { getIO } from'../socket.js';

const VALID_STATUSES = ['picked_up', 'in_transit', 'delivered', 'cancelled'];
const NEXT_STATUS = {
  assigned: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
};
/* Rider updates a delivery's status, must be the assigned rider, and must
 move forward exactly one step in the lifecycle (no skipping, no going backward).*/
export const deliveryStatus = async (req, res) => {
  const { deliveryId } = req.params;
  const { status, note } = req.body;
  const updated_by = req.user.id;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
  }

  const { data: delivery, error: fetchError } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', deliveryId)
    .single();
  if (fetchError) return res.status(404).json({ error: 'Delivery not found' });

  if (req.user.role === 'rider') {
    const { data: assignment } = await supabase
      .from('assignments')
      .select('rider_id')
      .eq('delivery_id', deliveryId)
      .maybeSingle();
    if (!assignment || assignment.rider_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this delivery' });
    }
    if (status !== 'cancelled' && NEXT_STATUS[delivery.status] !== status) {
      return res.status(409).json({
        error: `Cannot move from '${delivery.status}' to '${status}' — must follow the lifecycle order`,
      });
    }
  }

  const { error: updateError } = await supabase
    .from('deliveries')
    .update({ status })
    .eq('id', deliveryId);
  if (updateError) return res.status(500).json({ error: updateError.message });

  const { data, error } = await supabase
    .from('status_updates')
    .insert([{ delivery_id: deliveryId, status, updated_by, note }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  /* Push the status change to dispatchers watching the board and to the
   retailer who owns the order.*/
  const { data: fullDelivery } = await supabase
    .from('deliveries')
    .select('retailer_id')
    .eq('id', deliveryId)
    .single();

  const io = getIO();
  io.to('role:dispatcher').emit('delivery:status', { delivery_id: deliveryId, status });
  if (fullDelivery) {
    io.to(`user:${fullDelivery.retailer_id}`).emit('delivery:status', { delivery_id: deliveryId, status });
  }

  res.status(201).json(data);
};
