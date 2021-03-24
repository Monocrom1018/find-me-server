const models = require('../models');
const { isAuthorized } = require('./tokenFunctions');
const { getUserIdByToken } = require('../common');
const { answer, question } = models;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const moment = require('moment');
moment().format('YYYY-MM-DD');
module.exports = {
  // 비어있는 질문-대답 생성
  intro: async (req, res) => {
    //token검사
    const accessTokenData = isAuthorized(req, res);
    const requestUserId = await getUserIdByToken(accessTokenData);

    // 오늘 질문 받은 여부(개수) 체크
    const isAlreadyGetQuestion = await answer.findAll({
      where: {
        userId: requestUserId,
        questionAt: { [Op.gt]: new Date().toLocaleDateString() },
      },
    });

    const questionIndex =
      (await answer.max('questionId', {
        where: { userId: requestUserId },
      })) + 1 || 1;

    // 이미 질문 받았다면
    if (isAlreadyGetQuestion.length > 0) {
      await answer
        .findOne({
          include: [{ model: question, where: { id: questionIndex - 1 } }],
          where: { userId: requestUserId },
          attributes: ['id', 'questionAt'],
        })
        .then(data => {
          res.status(200).json({
            questionId: data.dataValues.question.dataValues.id,
            questionContent: data.dataValues.question.dataValues.content,
            answerId: data.dataValues.id,
            questionAt: data.dataValues.questionAt,
          });
        });
    } else {
      // 오늘 질문 받은 적 없다면

      // 질문(빈answer) 생성

      await answer.create({
        content: '',
        questionAt: moment().toDate(),
        userId: requestUserId,
        questionId: questionIndex,
      });

      // 쿼리로 원하는 속성 찾아 response
      await answer
        .findOne({
          include: [{ model: question, where: { id: questionIndex } }],
          where: { userId: requestUserId },
          attributes: ['id', 'questionAt'],
        })
        .then(data => {
          res.status(200).json({
            questionId: data.dataValues.question.dataValues.id,
            questionContent: data.dataValues.question.dataValues.content,
            answerId: data.dataValues.id,
            questionAt: data.dataValues.questionAt,
          });
        });
    }
  },
};
