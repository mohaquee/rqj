import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.includes("CHANGE_THIS")) {
  console.error("❌ JWT_SECRET not set or still using placeholder. Configure .env first.");
  process.exit(1);
}

/**
 * Express middleware: verifies Bearer token, attaches req.user
 * Returns 401 if missing/invalid.
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, employeeId, role, displayName, displayRole }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Director-only routes (Team management, Clients management, etc.)
 */
export function requireDirector(req, res, next) {
  if (req.user?.role !== "director") {
    return res.status(403).json({ error: "Director access required" });
  }
  next();
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });
}
