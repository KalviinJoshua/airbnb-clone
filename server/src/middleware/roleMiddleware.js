/**
 * Role Authorization Middleware
 * Enforces role-based access control on sensitive endpoints.
 */

/**
 * Enforce that the authenticated user possesses the required role.
 * Assumes authMiddleware has run and attached req.user.
 *
 * @param {string|string[]} roles - Allowed role(s), e.g. 'host' or ['host', 'admin']
 */
const requireRole = (roles) => {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required. Please log in.',
      });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: This action requires an account with ${allowed.join(' or ')} privileges.`,
      });
    }

    next();
  };
};

const requireHost = requireRole('host');

module.exports = {
  requireRole,
  requireHost,
};
