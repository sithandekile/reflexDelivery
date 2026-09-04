import supabase from "../db/supabaseClient.js";
import bcrypt from 'bcrypt';
import authmid  from '../middleware/auth.js';

const SALT_ROUNDS = 12;

//signup logic,for retailer,dispatcher and rider
export const signUp = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  if (!['retailer', 'dispatcher', 'rider'].includes(role)) {
    return res.status(400).json({ error: 'role must be retailer, dispatcher, or rider' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await supabase
    .from('users')
    .insert([{ name, email, password_hash, role, phone }])
    .select('id, name, email, role, phone, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = authmid.signToken(user);
  res.status(201).json({ token, user });
};
//login logic
export const signIn = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, phone, password_hash')
    .eq('email', email)
    .maybeSingle();

  
  if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const { password_hash, ...safeUser } = user;
  const token = authmid.signToken(safeUser);
  res.json({ token, user: safeUser });
};