const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/db');

function buildRes() {
  return {
    statusCode: 200,
    body: null,
    redirectUrl: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    redirect(status, url) {
      if (typeof status === 'string') {
        this.redirectUrl = status;
      } else {
        this.statusCode = status;
        this.redirectUrl = url;
      }
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
    }
  };
}

test('resolveQrCode redirects direct URL requests with 302', async () => {
  const originalQuery = db.query;
  let queryText = '';
  
  db.query = async (text, params) => {
    queryText = text;
    return {
      rows: [{
        id: 'qr-1',
        title: 'My URL QR',
        content: 'https://example.com/dest',
        type: 'url',
        scans: 10
      }]
    };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/qrCodesController')];
    const { resolveQrCode } = require('../src/controllers/qrCodesController');
    const req = { params: { id: 'qr-1' }, headers: { accept: 'text/html' } };
    const res = buildRes();

    await resolveQrCode(req, res);

    assert.ok(queryText.includes('UPDATE qr_codes SET scans'));
    assert.equal(res.statusCode, 302);
    assert.equal(res.redirectUrl, 'https://example.com/dest');
  } finally {
    db.query = originalQuery;
  }
});

test('resolveQrCode returns JSON to JSON-accepting clients', async () => {
  const originalQuery = db.query;
  
  db.query = async (text, params) => {
    return {
      rows: [{
        id: 'qr-1',
        title: 'My URL QR',
        content: 'https://example.com/dest',
        type: 'url',
        scans: 11
      }]
    };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/qrCodesController')];
    const { resolveQrCode } = require('../src/controllers/qrCodesController');
    const req = { params: { id: 'qr-1' }, headers: { accept: 'application/json' } };
    const res = buildRes();

    await resolveQrCode(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 'qr-1');
    assert.equal(res.body.redirectUrl, 'https://example.com/dest');
  } finally {
    db.query = originalQuery;
  }
});

test('resolveBarcode returns JSON containing redirectUrl to JSON-accepting clients', async () => {
  const originalQuery = db.query;
  
  db.query = async (text, params) => {
    return {
      rows: [{
        id: 'bc-1',
        name: 'My Barcode',
        content: 'https://example.com/dest-bc',
        barcode_type: 'qr',
        scans: 5
      }]
    };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/barcodesController')];
    const { resolveBarcode } = require('../src/controllers/barcodesController');
    const req = { params: { id: 'bc-1' }, headers: { accept: 'application/json' } };
    const res = buildRes();

    await resolveBarcode(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 'bc-1');
    assert.equal(res.body.redirectUrl, 'https://example.com/dest-bc');
  } finally {
    db.query = originalQuery;
  }
});

test('quizBuilder.getPublicQuiz strips correct answers from the payload', async () => {
  const originalQuery = db.query;
  
  db.query = async (text, params) => {
    return {
      rows: [{
        id: 'quiz-1',
        title: 'Capital Cities',
        description: 'Test your geography knowledge',
        published: true,
        questions: [
          { type: 'multiple_choice', text: 'Capital of Nigeria?', options: ['Abuja', 'Lagos', 'Ibadan', 'Kano'], correct_answer: 0 },
          { type: 'true_false', text: 'Is Abuja the capital?', options: ['True', 'False'], correct_answer: 'True' }
        ],
        settings: { showScore: true }
      }]
    };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/quizBuilderController')];
    const { getPublicQuiz } = require('../src/controllers/quizBuilderController');
    const req = { params: { id: 'quiz-1' } };
    const res = buildRes();

    await getPublicQuiz(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.quiz);
    assert.equal(res.body.quiz.questions.length, 2);
    // Ensure correct answers are stripped
    assert.equal(res.body.quiz.questions[0].correct_answer, undefined);
    assert.equal(res.body.quiz.questions[1].correct_answer, undefined);
  } finally {
    db.query = originalQuery;
  }
});

test('quizBuilder.submitResponse grades answers and saves respondent details', async () => {
  const originalQuery = db.query;
  let insertLog = [];
  
  db.query = async (text, params) => {
    if (text.includes('SELECT org_id, questions')) {
      return {
        rows: [{
          org_id: 'org-1',
          questions: [
            { type: 'multiple_choice', text: 'Capital of Nigeria?', options: ['Abuja', 'Lagos'], correct_answer: 0 },
            { type: 'true_false', text: 'Is Abuja the capital?', correct_answer: 'True' }
          ]
        }]
      };
    }
    if (text.includes('INSERT INTO quiz_responses')) {
      insertLog.push(params);
      return {
        rows: [{
          id: 'resp-1',
          quiz_id: 'quiz-1',
          org_id: 'org-1',
          answers: params[2],
          score: params[3],
          max_score: params[4],
          respondent_name: params[5],
          respondent_email: params[6]
        }]
      };
    }
    return { rows: [] };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/quizBuilderController')];
    const { submitResponse } = require('../src/controllers/quizBuilderController');
    
    // Simulating correct first answer (Abuja: index 0) and wrong second answer (False: should be True)
    const req = {
      params: { quizId: 'quiz-1' },
      body: {
        respondentName: 'Test Student',
        respondentEmail: 'student@test.com',
        answers: [
          { answer: 0 },
          { answer: 'False' }
        ]
      }
    };
    const res = buildRes();

    await submitResponse(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.score, 1); // 1 correct out of 2
    assert.equal(res.body.maxScore, 2);
    
    // Verify values inserted to DB
    assert.equal(insertLog.length, 1);
    const dbParams = insertLog[0];
    assert.equal(dbParams[3], 1); // score
    assert.equal(dbParams[4], 2); // max_score
    assert.equal(dbParams[5], 'Test Student'); // respondent name
    assert.equal(dbParams[6], 'student@test.com'); // respondent email
  } finally {
    db.query = originalQuery;
  }
});
