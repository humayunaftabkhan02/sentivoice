exports.home = (req, res) => {
    res.json({ 
        message: 'Welcome to SentiVoice API',
        version: '1.0.0',
        status: 'running'
    });
};
