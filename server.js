require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// 讓 index.html 可以被打開
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

// 網頁叫貨 API
app.post('/api/order', async (req, res) => {
  try {
    const { groupId, item, quantity, note } = req.body;

    if (!groupId || !item || !quantity) {
      return res.status(400).json({
        success: false,
        message: '缺少群組、品項或數量'
      });
    }

    const message = `【叫貨單】
品項：${item}
數量：${quantity}
備註：${note || '無'}`;

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});