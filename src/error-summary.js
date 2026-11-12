function summarizeError(error) {
  return {
    message: error.message,
    code: error.code,
    status: error.response?.status
  };
}

module.exports = {
  summarizeError
};
