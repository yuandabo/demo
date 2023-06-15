const express = require('express');
const path = require('path');

const app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  const PORT = process.env.PORT || 3000;

  // 使用静态资源
app.use('/static', express.static(__dirname + '/static'))

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});