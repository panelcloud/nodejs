const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Registre
router.post('/register', async (req, res) => {
  const { email, password, nom } = req.body;
  
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.json({ ok: false, error: error.message });

  // Actualitzar nom al perfil
  if (nom) {
    await supabase.from('profiles').update({ nom }).eq('id', data.user.id);
  }

  res.json({ ok: true });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.json({ ok: false, error: error.message });

  res.cookie('sb_token', data.session.access_token, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dies
  });

  res.json({ ok: true });
});

// Logout
router.post('/logout', async (req, res) => {
  res.clearCookie('sb_token');
  res.json({ ok: true });
});

// Estat sessió
router.get('/me', async (req, res) => {
  const token = req.cookies.sb_token;
  if (!token) return res.json({ ok: false });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.json({ ok: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  res.json({ ok: true, user: profile });
});

module.exports = router;
