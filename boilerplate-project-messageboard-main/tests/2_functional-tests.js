const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
chai.use(chaiHttp);

suite('Functional Tests', function() {
  let threadId;
  let replyId;
  const board = 'testBoard';
  const deletePassword = 'testPassword';
  const invalidPassword = 'wrongPassword';

  suite('Threads', function () {
    test('Creating a new thread (POST /api/threads/:board)', function (done) {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({ text: 'Test thread', delete_password: deletePassword })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.include(res.redirects[0], `/b/${board}/`);
          done();
        });
    });

    test('Viewing the 10 most recent threads with 3 replies each (GET /api/threads/:board)', function (done) {
      chai.request(server)
        .get(`/api/threads/${board}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          res.body.forEach(thread => {
            assert.isArray(thread.replies);
            assert.isAtMost(thread.replies.length, 3);
          });
          threadId = res.body[0]._id; // Save the first thread ID for later tests
          done();
        });
    });

    test('Deleting a thread with the incorrect password (DELETE /api/threads/:board)', function (done) {
      chai.request(server)
        .delete(`/api/threads/${board}`)
        .send({ thread_id: threadId, delete_password: invalidPassword })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a thread with the correct password (DELETE /api/threads/:board)', function (done) {
      chai.request(server)
        .delete(`/api/threads/${board}`)
        .send({ thread_id: threadId, delete_password: deletePassword })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Reporting a thread (PUT /api/threads/:board)', function (done) {
      chai.request(server)
        .put(`/api/threads/${board}`)
        .send({ thread_id: '678fbd9ebc6fe69168dcd17d' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });

  suite('Replies', function () {
    test('Creating a new reply (POST /api/replies/:board)', function (done) {
      chai.request(server)
        .post(`/api/replies/${board}`)
        .send({ text: 'Test reply', delete_password: deletePassword, thread_id: '678fbd9ebc6fe69168dcd17d' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing a single thread with all replies (GET /api/replies/:board)', function (done) {
      chai.request(server)
        .get(`/api/replies/${board}`)
        .query({ thread_id: '678fbd9ebc6fe69168dcd17d' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.equal(res.body._id, '678fbd9ebc6fe69168dcd17d');
          assert.isArray(res.body.replies);
          replyId = res.body.replies[0]._id; // Save the first reply ID for later tests
          done();
        });
    });

    test('Deleting a reply with the incorrect password (DELETE /api/replies/:board)', function (done) {
      chai.request(server)
        .delete(`/api/replies/${board}`)
        .send({ thread_id: '678fbd9ebc6fe69168dcd17d', reply_id: replyId, delete_password: invalidPassword })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a reply with the correct password (DELETE /api/replies/:board)', function (done) {
      chai.request(server)
        .delete(`/api/replies/${board}`)
        .send({ thread_id: '678fbd9ebc6fe69168dcd17d', reply_id: '678fbda8bc6fe69168dcd180', delete_password: 'test' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Reporting a reply (PUT /api/replies/:board)', function (done) {
      chai.request(server)
        .put(`/api/replies/${board}`)
        .send({ thread_id: '678fbd9ebc6fe69168dcd17d', reply_id: '678fbda8bc6fe69168dcd180' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });
});
