'use strict';

module.exports = function (app) {
  const bcrypt = require('bcrypt');
  const mongoose = require('mongoose');
  
  const threadSchema = new mongoose.Schema({
    board: { type: String, required: true },
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false },
    created_on: { type: Date, default: Date.now },
    bumped_on: { type: Date, default: Date.now },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reply'}]
  });

  const replySchema = new mongoose.Schema({
    board: { type: String, required: true },
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false },
    created_on: { type: Date, default: Date.now },
    thread_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true }
  });

  const Thread = mongoose.model('Thread', threadSchema);
  const Reply = mongoose.model('Reply', replySchema);

  
  app.route('/api/threads/:board')
    .post(async (req,res) => {
      const { text, delete_password } = req.body,
            { board } = req.params;
      const hashedPassword = await bcrypt.hash(delete_password, 10);
      try {
        const newThread = new Thread({
          board: board,
          text: text,
          delete_password: hashedPassword
        });
        await newThread.save()
        return res.redirect(`/b/${board}/`);
      } catch(err) { return res.status(500).json({ error: err })}
    })
    .get(async (req,res) => {
      const { board } = req.params;
      try {
        const threads = await Thread.find({ board: board })
          .select('-delete_password -reported')
          .sort({ bumped_on: -1 })
          .limit(10).populate({path: 'replies', select: '-delete_password -reported', options: { sort: { created_on: -1 }, limit: 3 }});
        if ( !threads ) return res.status(404).json({ error: 'board not found'});
        return res.json(threads);
      } catch(err) { return res.status(500).json({ error: err })}
    })
    .put(async (req,res) => {
      const { thread_id } = req.body;
      try {
        const thread = await Thread.findByIdAndUpdate(thread_id, { reported: true });
        if ( !thread ) return res.status(404).json({ error: 'board not found'});
        return res.send('reported')
      } catch(err) { return res.status(500).json({ error: err })}
    })
    .delete(async (req,res) => {
      const { thread_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if ( !thread ) return res.status(404).json({ error: 'board not found'});
        const isPasswordValid = await bcrypt.compare(delete_password, thread.delete_password);
        if (isPasswordValid) {
          await Thread.findByIdAndDelete(thread_id);
          return res.send('success');
        } else  {
          return res.send('incorrect password');
        }        
      } catch(err) { return res.status(500).json({ error: err })}
    });
    
  app.route('/api/replies/:board')
    .post(async (req,res) => {
      const { text, delete_password, thread_id } = req.body,
            { board } = req.params;      
      try {
        const hashedPassword = await bcrypt.hash(delete_password, 10);
        const reply = new Reply({
          board: board,
          text: text,
          delete_password: hashedPassword,
          thread_id: thread_id
        });
        const savedReply = await reply.save();
        const thread = await Thread.findById(thread_id);
        thread.replies.push(savedReply._id);
        thread.bumped_on = savedReply.created_on;
        await thread.save();
        const populatedThread = await Thread.findById(thread_id).populate('replies');
        return res.redirect(`/b/${board}/${thread_id}`);
      } catch(err) { return res.status(500).json({ error: err })}      
    })
    .get(async (req,res) => {
      const { board } = req.params;
      const { thread_id } = req.query;
      try {
        const thread = await Thread.findById(thread_id).select('-delete_password -reported').populate({path: 'replies', select: '-delete_password -reported'});
        if (!thread) return res.status(404).json({ error: 'thread not found'});
        return res.send(thread);
      } catch(err) { return res.status(500).json({ error: err })}      
    })
    .put(async (req,res) => {
      const { thread_id, reply_id } = req.body;
      try { 
        const thread = await Thread.findById(thread_id);        
        if (!thread) return res.status(404).json({ error: 'thread not found'});
        const reply = await Reply.findById(reply_id);
        if (!reply) return res.status(404).json({ error: 'reply not found'});
        reply.reported = true;
        await thread.save();
        return res.send('reported');
      } catch(err) { return res.status(500).json({ error: err })}      
    })
    .delete(async (req,res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      try {
        const reply = await Reply.findById(reply_id);
        if ( !reply ) return res.status(404).json({ error: 'reply not found'});
        const isPasswordValid = await bcrypt.compare(delete_password, reply.delete_password);
        if (isPasswordValid) {
          reply.text = '[deleted]';
          console.log(reply);
          await reply.save();
          const thread = await Thread.findById(thread_id);
          if (!thread) return res.status(404).json({ error: 'thread not found'});
          await thread.save();
          return res.send('success');
        } else  {
          return res.send('incorrect password');
        }        
      } catch(err) { return res.status(500).json({ error: err })}
    });

};
