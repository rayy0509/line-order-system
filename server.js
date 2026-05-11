require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// 接收 LINE webhook
app.post('/webhook', (req, res) => {
  console.log('收到 LINE Webhook：');
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// 自動發送 LINE 群組訊息
async function sendLineGroupMessage(groupId, text) {
  await axios.post(
    'https://api.line.me/v2/bot/message/push',
    {
      to: groupId,
      messages: [
        {
          type: 'text',
          text: text
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

// 首頁顯示 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 多商品自動分群叫貨 API
app.post('/api/group-order', async (req, res) => {
  try {
    const { groupId, groupName, items } = req.body;

    if (!groupId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少群組或商品資料'
      });
    }

    let message = `【叫貨單】\n`;
    message += `群組：${groupName}\n\n`;

    items.forEach(item => {
      message += `${item.name}：${item.quantity}${item.unit}\n`;
    });

    await sendLineGroupMessage(groupId, message);

    res.json({
      success: true,
      message: '叫貨單已送出'
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: 'LINE 發送失敗'
    });
  }
});

// 保留測試發送
app.get('/send', async (req, res) => {
  try {
    const groupId = 'C25d9561788d0c09b6e0aaa351386ae78';

    const message = `【叫貨單】
品項：鮮奶
數量：6瓶
備註：今天下午前送到`;

    await sendLineGroupMessage(groupId, message);

    res.send('已發送到 LINE 群組');
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('發送失敗');
  }
});


// 測試 MySQL 連線
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS time');

    res.json({
      success: true,
      time: rows[0].time
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});