import supabase from '../db/supabaseClient.js';

// List users, optionally filtered by role, eg: dispatcher loading available riders
export const fetchUser = async (req, res) => {
  const { role } = req.query;
  let query = supabase.from('users').select('id, name, email, role, phone, created_at');
  if (role) query = query.eq('role', role);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
export const fetchMe= async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, phone, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
};
