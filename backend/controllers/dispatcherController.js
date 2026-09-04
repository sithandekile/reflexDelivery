import supabase from '../db/supabaseClient.js';
import { getIO } from '../socket.js';

export const assignDelivery = async (req, res) => {
  const { delivery_id, rider_id } = req.body;
  const dispatcher_id = req.user.id;

  if (!delivery_id || !rider_id) {
    return res.status(400).json({ error: 'delivery_id and rider_id are required' });
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', delivery_id)
    .single();

  if (deliveryError) return res.status(404).json({ error: 'Delivery not found' });
  if (delivery.status !== 'pending') {
    return res.status(409).json({ error: `Delivery is already '${delivery.status}'` });
  }

  const { data: assignment, error: assignError } = await supabase
    .from('assignments')
    .insert([{ delivery_id, rider_id, dispatcher_id }])
    .select()
    .single();
  if (assignError) return res.status(500).json({ error: assignError.message });

  const { error: statusError } = await supabase
    .from('deliveries')
    .update({ status: 'assigned' })
    .eq('id', delivery_id);
  if (statusError) return res.status(500).json({ error: statusError.message });

  await supabase.from('status_updates').insert([
    { delivery_id, status: 'assigned', updated_by: dispatcher_id, note: `Assigned to rider ${rider_id}` },
  ]);

  const io = getIO();
  // Tell every dispatcher this order is off the pending board...
  io.to('role:dispatcher').emit('delivery:assigned', { delivery_id, rider_id });
  // ...and tell that specific rider they have got a new job.
  io.to(`user:${rider_id}`).emit('assignment:new', { delivery_id, assignment });

  res.status(201).json(assignment);
};