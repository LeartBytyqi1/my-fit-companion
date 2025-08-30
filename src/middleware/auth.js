const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

module.exports = async function (req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied, no token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user data from Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user; // Full user object with role, etc.
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};