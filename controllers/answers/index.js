const models = require('../../models');
const { user, question, answer } = models;
const { isAuthorized } = require('../tokenFunctions');
module.exports = {
  //질문 list 출력
  answer: async (req, res) => {
    //사용자 토큰 확인 및 userId 접근
    const accessTokenData = isAuthorized(req);
    if (!accessTokenData) {
      return res.json({ data: null, message: 'invalid access token' });
    }
    // DB에서 해당 사용자의 모든 질문 가져오기
    const queryData = await answer.findAll({
      include: [{ model: question, attributes: ['content'] }],
      where: { userId: accessTokenData.id },
      attributes: ['id'],
    });

    // Client가 요구하는 data format으로 변경
    const reformatData = queryData.map(function (data) {
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
    if (!accessTokenData) {
      return res.json({ data: null, message: 'invalid access token' });
    }

    const answerId = req.body.answerId;
    const answerContent = req.body.answerContent;

    await answer.findOne({ where: { id: answerId } }).then(async data => {
      // 요청한 사용자가 작성한 글의 주인이 맞는지 확인
      if (data.userId !== accessTokenData.id) {
        res.status(401).json({ data: null, message: 'not authorized user' });
      }
      // 맞다면 content 바꾸고, 생성날짜 확인하여 저장
      await answer.update(
        { content: answerContent, createdAt: new Date() }, //ToDo: 현지 시간으로 바꾸기 (관련 이슈 헬프데스크에 올려놓은 상태)
        { where: { id: answerId } },
      );

      res.status(200).json({ message: 'A anwser has been successfully added' });
    });
  },

  //질문-대답 상세페이지 (read/detail)
  readAnswer: async (req, res) => {
    //사용자 토큰 확인 및 userId 접근
    const accessTokenData = isAuthorized(req);
    if (!accessTokenData) {
      return res.json({ data: null, message: 'invalid access token' });
    }

    // 특정 answerId에 해당하는 answer&question 출력
    const answerId = req.body.answerId;

    const queryData = await answer.findOne({
      include: [question],
      where: { id: answerId },
      attributes: ['id', 'content', 'questionAt', 'createdAt', 'updatedAt'],
    });

    // Client에서 원하는 데이터 형식으로 변환
    const reformatData = {
      questionId: queryData.question.id,
      questionContent: queryData.question.content,
      answerId: queryData.id,
      answerContent: queryData.content,
      createdAt: queryData.createdAt,
      updatedAt: queryData.updatedAt,
      questionAt: queryData.questionAt,
    };
    res.status(200).json(reformatData);
  },

  //대답 수정 응답 (edit)
  editAnswer: async (req, res) => {
    const accessTokenData = isAuthorized(req);
    if (!accessTokenData) {
      return res.json({ data: null, message: 'invalid access token' });
    }

    const answerId = req.body.answerId;
    const answerContent = req.body.answerContent;

    await answer.findOne({ where: { id: answerId } }).then(async data => {
      // 요청한 사용자가 작성한 글의 주인이 맞는지 확인
      if (data.userId !== accessTokenData.id) {
        res.status(401).json({ data: null, message: 'not authorized user' });
      }
      // 맞다면 content 바꾸고, 생성날짜 확인하여 저장
      await answer.update(
        { content: answerContent, updatedAt: new Date() }, //ToDo: 현지 시간으로 바꾸기 (관련 이슈 헬프데스크에 올려놓은 상태)
        { where: { id: answerId } },
      );

      res
        .status(200)
        .json({ message: 'A anwser has been successfully updated' });
    });
  },
};
