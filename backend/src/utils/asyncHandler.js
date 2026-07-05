// Wrap an async Express handler so a thrown/rejected error becomes a clean
// error response instead of an unhandled rejection. Without this, a route
// that awaits something that throws (bad file, DB hiccup, fs error) leaves
// the client hanging forever and — pre-Node-15-safety-net — could crash the
// whole process for every tenant.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
