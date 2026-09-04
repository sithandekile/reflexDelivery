import supabase from "../db/supabaseClient.js";
import { getIO } from "../socket.js";

//retailer creates new delivery
export const createDelivery = async (req, res) => {
  const { pickup_address, dropoff_address, package_note } = req.body;
  const retailer_id = req.user.id; // trust the token, not the request body

  if (!pickup_address || !dropoff_address) {
    return res.status(400).json({
      error: 'pickup_address and dropoff_address are required',
    });
  }

  const { data, error } = await supabase
    .from('deliveries')
    .insert([{ retailer_id, pickup_address, dropoff_address, package_note }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('status_updates').insert([
    { delivery_id: data.id, status: 'pending', updated_by: retailer_id },
  ]);

  /*Push the new order straight to every connected dispatcher,this is the
  "reflex" part: no polling delay, dispatchers see it the instant it's created.*/
  getIO().to('role:dispatcher').emit('delivery:new', data);

  res.status(201).json(data);
};
// Dispatcher board list deliveries, optionally filtered by status
export const fetchDeliveries = async (req, res) => {
  const { status } = req.query;

  if (req.user.role === 'rider') {
    let qtyQuery = supabase
      .from('assignments')
      .select('delivery_id')
      .eq('rider_id', req.user.id);

    if (status) qtyQuery = qtyQuery.eq('deliveries.status', status);

    const { data: assignmentRows, error: assignmentError } = await qtyQuery;
    if (assignmentError) return res.status(500).json({ error: assignmentError.message });

    const deliveryIds = assignmentRows?.map(row => row.delivery_id) || [];
    if (!deliveryIds.length) return res.json([]);

    let query = supabase
      .from('deliveries')
      .select('*')
      .in('id', deliveryIds)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  let query = supabase.from('deliveries').select('*').order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  /* Retailers only ever see their own orders; dispatchers/riders see everything
   relevant to the filters they pass.*/
  if (req.user.role === 'retailer') {
    query = query.eq('retailer_id', req.user.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
// Single delivery with its status history and assignment if any
export const fetchSingleDelivery = async (req, res) => {
  const { id } = req.params;

  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', id)
    .single();
  if (deliveryError) return res.status(404).json({ error: 'Delivery not found' });

  if (req.user.role === 'retailer' && delivery.retailer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your delivery' });
  }

  const { data: history } = await supabase
    .from('status_updates')
    .select('*')
    .eq('delivery_id', id)
    .order('created_at', { ascending: true });

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*, rider:rider_id(id, name, phone)')
    .eq('delivery_id', id)
    .maybeSingle();

  // Riders can only view deliveries assigned to them
  if (req.user.role === 'rider' && assignment?.rider_id !== req.user.id) {
    return res.status(403).json({ error: 'Not assigned to you' });
  }

  res.json({ ...delivery, history, assignment });
};
