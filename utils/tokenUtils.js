const jwt = require('jsonwebtoken');

const ACCESS_EXPIRE = '1d';
const REFRESH_EXPIRE = '7d';

function generateAccessToken(id, role) {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || '1312_cafe_jwt_secret_key_2026_premium',
    { expiresIn: ACCESS_EXPIRE }
  );
}

function generateRefreshToken(id, role) {
  return jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET || '1312_cafe_jwt_refresh_secret_key_2026_premium',
    { expiresIn: REFRESH_EXPIRE }
  );
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
