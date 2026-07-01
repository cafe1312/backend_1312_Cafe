const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const maxRequestsPerWindow = 10000; // limit each IP to 10000 requests per window

const ipRequestCountMap = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!ipRequestCountMap.has(ip)) {
    ipRequestCountMap.set(ip, []);
  }

  const timestamps = ipRequestCountMap.get(ip);
  
  // Filter out timestamps older than the window
  const activeTimestamps = timestamps.filter(time => now - time < rateLimitWindowMs);
  activeTimestamps.push(now);
  ipRequestCountMap.set(ip, activeTimestamps);

  if (activeTimestamps.length > maxRequestsPerWindow) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  }

  next();
}

module.exports = { rateLimiter };
