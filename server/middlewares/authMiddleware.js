const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware Authenticate Bearer Token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak. Token autentikasi tidak ditemukan'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email, name, role: { id, name, permissions } }
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token autentikasi tidak valid atau telah kedaluwarsa'
    });
  }
}

/**
 * Middleware Granular Permission Check (RBAC)
 * @param {string|string[]} requiredPermissions 
 */
function requirePermission(requiredPermissions) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses dilarang. Hak akses role tidak teridentifikasi'
      });
    }

    const userPermissions = req.user.role.permissions || [];
    
    // Super Admin has wildcard "*" access
    if (userPermissions.includes('*')) {
      return next();
    }

    const needed = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    // Check if user has all required permissions or wildcard prefix (e.g. coa.*)
    const hasPermission = needed.every(permission => {
      if (userPermissions.includes(permission)) return true;
      
      const [category] = permission.split('.');
      if (userPermissions.includes(`${category}.*`)) return true;

      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: `Akses dilarang. Anda tidak memiliki izin [${needed.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requirePermission
};
