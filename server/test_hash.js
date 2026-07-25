const bcrypt = require('bcryptjs');
const hash = '$2b$10$n12RreO0hpyMSLMYsDOVxe4g933vgAs0Ox2lxPryNTXq5j4dUQtgG';
const pwds = ['admin', 'admin123', 'password', 'password123', '123456', '12345678', 'OrgFinance2026', 'SystemAdmin123'];
pwds.forEach(p => {
  if (bcrypt.compareSync(p, hash)) console.log("Match: " + p);
});
