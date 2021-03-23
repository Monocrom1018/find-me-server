const models = require('../../models');
const { user, question, answer } = models;
const { isAuthorized } = require('../tokenFunctions');
const { getUserIdByToken } = require('../../common');
module.exports = {
  //질문 list 출력
  answer: async (req, res) => {
    //사용자 토큰 확인 및 userId 접근
    const accessTokenData = isAuthorized(req);
    const requestUserId = await getUserIdByToken(accessTokenData);
    // DB에서 해당 사용자의 모든 질문 가져오기
    const questionData = await answer.findAll({
      include: [{ model: question, attributes: ['content'] }],
      where: { userId: requestUserId },
      attributes: ['id'],
    });

    // Client가 요구하는 data format으로 변경
    const reformatData = questionData.map(function (data) {
      return {
        answerId: data.id,
        questionContent: data.question.content,
      };
    });

    res.status(200).json(reformatData);
  },

  //질문에 대한 대답 작성 (add)
  addAnswer: async (req, res) => {
    const accessTokenData = isAuthorized(req);
    const requestUserId = await getUserIdByToken(accessTokenData);

    const { answerId, answerContent } = req.body;

    await answer.findOne({ where: { id: answerId } }).then(async data => {
      // 요청한 사용자가 작성한 글의 주인이 맞는지 확인
      if (data.userId !== requestUserId) {
        res.status(401).json({ data: null, message: 'not authorized user' });
      }
      // 맞다면 content 바꾸고, 생성날짜 확인하여 저장
      await answer.update(
        { content: answerContent, createdAt: new Date() },
        { where: { id: answerId } },
      );

      res.status(200).json({ message: 'A answer has been successfully added' });
    });
  },

  //질문-대답 상세페이지 (read/detail)
  readAnswer: async (req, res) => {
    //사용자 토큰 확인 및 userId 접근
    const accessTokenData = isAuthorized(req);
    const requestUserId = await getUserIdByToken(accessTokenData);
    // 특정 answerId에 해당하는 answer&question 출력
    const { answerId } = req.body;

    const questionData = await answer.findOne({
      include: [question],
      where: { id: answerId },
      attributes: [
        'id',
        'content',
        'questionAt',
        'createdAt',
        'updatedAt',
        'userId',
      ],
    });
    // 요청한 사용자가 작성한 글의 주인이 맞는지 확인
    if (questionData.userId !== requestUserId) {
      res.status(401).json({ data: null, message: 'not authorized user!' });
    }

    // Client에서 원하는 데이터 형식으로 변환
    const reformatData = {
      questionId: questionData.question.id,
      questionContent: questionData.question.content,
      answerId: questionData.id,
      answerContent: questionData.content,
      createdAt: questionData.createdAt,
      updatedAt: questionData.updatedAt,
      questionAt: questionData.questionAt,
    };
    res.status(200).json(reformatData);
  },

  //대답 수정 응답 (edit)
  editAnswer: async (req, res) => {
    const accessTokenData = isAuthorized(req);
    const requestUserId = await getUserIdByToken(accessTokenData);
    const { answerId, answerContent } = req.body;

    await answer.findOne({ where: { id: answerId } }).then(async data => {
      // 요청한 사용자가 작성한 글의 주인이 맞는지 확인
      if (data.userId !== requestUserId) {
        res.status(401).json({ data: null, message: 'not authorized user' });
      }
      // 맞다면 content 바꾸고, 생성날짜 확인하여 저장
      await answer.update(
        { content: answerContent, updatedAt: new Date() },
        { where: { id: answerId } },
      );
      res
        .status(200)
        .json({ message: 'A answer has been successfully updated' });
    });
  },
};
