const models = require('../../models');
const { user } = models;
const dotenv = require('dotenv');
dotenv.config();

const { generateAccessToken, sendAccessToken } = require('../tokenFunctions');
const { isAuthorized } = require('../tokenFunctions');

module.exports = {
  // 화원가입
  signup: async (req, res) => {
    try {
      const emailCheck = await user.findOne({
        where: { email: req.body.email },
      });
      if (emailCheck) {
        return res.status(409).send('This email already exists');
      }

      await user.create({
        email: req.body.email,
        password: req.body.password,
        nickname: req.body.nickname,
      });

      res.status(200).json('Signup is successed');
    } catch (err) {
      res.status(500).send('Server is broken');
    }
  },
  // 로그인
  signin: async (req, res) => {
    try {
      const { email, password } = req.body;
      user
        .findOne({
          where: {
            email,
            password,
          },
        })
        .then(data => {
          if (!data) {
            return res
              .status(401)
              .json({ message: 'Invalid user or Wrong password' });
          }

          delete data.dataValues.password;
          const accessToken = generateAccessToken(data.dataValues);
          sendAccessToken(res, accessToken);
        });
    } catch (err) {
      res.status(500).json({ message: 'Server is broken' });
    }
  },
  // 로그아웃
  signout: async (req, res) => {
    if (!req.cookies.accessToken) res.status(400).json('not authorized');
    else {
      res.clearCookie('accessToken');
      res.status(200).json('successfully signed out!');
    }
  },

  // 유저정보 조회
  userinfo: async (req, res) => {
    try {
      const accessTokenData = isAuthorized(req);
      const queryData = await user.findOne({
        where: { email: accessTokenData.email },
      });

      if (!queryData) {
        return res.status(401).send('not authorized');
      }

      res.status(200).json({
        id: queryData.id,
        password: queryData.password,
        email: queryData.email,
        nickname: queryData.nickname,
      });
    } catch (err) {
      res.status(500).send('Server is broken');
    }
  },
  // 비밀번호 변경
  update: async (req, res) => {
    const result = await user.findOne({
      where: { id: req.params.userid },
    });
    res
      .status(200)
      .send(`${result.nickname}'s password is successfully changed`);
  },
  // 회원탈퇴
  delete: async (req, res) => {
    const result = await user.findOne({
      where: { id: req.params.userid },
    });
    res
      .status(200)
      .send(`${result.nickname}'s account is successfully deleted`);
  },
};
