const bcrypt = require('bcrypt');
const { sequelize, User, RefreshToken } = require('../models');
const {
  signAccessToken,
  createRefreshToken,
  hashRefreshToken,
  refreshTokenExpiration
} = require('../utils/authTokens');
const { setAuthCookies, clearAuthCookies } = require('../utils/authCookies');

function issueAccessToken(user) {
  return signAccessToken({ id: user.id, email: user.email });
}

async function persistRefreshToken(userId, rawToken, transaction) {
  await RefreshToken.create({
    userId,
    tokenHash: hashRefreshToken(rawToken),
    expiresAt: refreshTokenExpiration(),
    revokedAt: null
  }, { transaction });
}

async function login(req, res) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Informe um email válido e uma senha.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    const access = issueAccessToken(user);
    const refreshToken = createRefreshToken();
    await persistRefreshToken(user.id, refreshToken);
    setAuthCookies(res, access.token, refreshToken, access.expiresIn);

    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      tokenType: 'Bearer',
      expiresIn: access.expiresIn
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Não foi possível realizar o login.' });
  }
}

async function refresh(req, res) {
  const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (typeof rawToken !== 'string' || rawToken.length < 32 || rawToken.length > 256) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Sessão expirada. Entre novamente.' });
  }

  try {
    const result = await sequelize.transaction(async transaction => {
      const session = await RefreshToken.findOne({
        where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
        const error = new Error('Refresh token inválido ou expirado.');
        error.status = 401;
        throw error;
      }

      const user = await User.findByPk(session.userId, { transaction });
      if (!user || !user.email || !user.password) {
        const error = new Error('Usuário não encontrado ou sem credenciais válidas.');
        error.status = 401;
        throw error;
      }

      await session.update({ revokedAt: new Date() }, { transaction });
      const newRefreshToken = createRefreshToken();
      await persistRefreshToken(user.id, newRefreshToken, transaction);
      const access = issueAccessToken(user);
      return {
        user: { id: user.id, name: user.name, email: user.email },
        accessToken: access.token,
        refreshToken: newRefreshToken,
        expiresIn: access.expiresIn
      };
    });

    setAuthCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    return res.json({
      user: result.user,
      tokenType: 'Bearer',
      expiresIn: result.expiresIn
    });
  } catch (error) {
    if (error.status === 401) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Sessão expirada. Entre novamente.' });
    }
    console.error('Erro ao renovar token:', error);
    return res.status(500).json({ message: 'Não foi possível renovar a sessão.' });
  }
}

async function logout(req, res) {
  const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
  try {
    if (typeof rawToken === 'string' && rawToken.length >= 32 && rawToken.length <= 256) {
      await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null } }
      );
    }
    clearAuthCookies(res);
    return res.json({ message: 'Sessão encerrada.' });
  } catch (error) {
    console.error('Erro no logout:', error);
    clearAuthCookies(res);
    return res.status(500).json({ message: 'Não foi possível encerrar a sessão.' });
  }
}

module.exports = { login, refresh, logout };
