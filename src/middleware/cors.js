function cors(allowedOrigins = []) {
  const origins = new Set(allowedOrigins);

  return (req, res, next) => {
    const origin = req.get('origin');

    if (origin && origins.has(origin)) {
      res.vary('Origin');
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
    }

    return next();
  };
}

module.exports = {
  cors
};
