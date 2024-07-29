const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
// const bodyParser = require('body-parser');
// const sgMail = require('@sendgrid/mail');
// const PORT = process.env.PORT || 3000;

// sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

// app.use(bodyParser.json());

// app.post('/send-email', (req, res) => {
//   const { to, subject, message } = req.body;

//   const msg = {
//     to: to,
//     from: 'your_email@example.com', // Use the email address or domain you verified with SendGrid
//     subject: subject,
//     text: message,
//     html: `<strong>${message}</strong>`,
//   };

//   sgMail.send(msg)
//     .then(() => {
//       console.log('Email sent');
//       res.status(200).send('Email sent');
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).send('Error sending email');
//     });
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/Air_Quality_Index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Air_Quality_Index.html'));
});

app.get('/Bar_chart_Comp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Bar_chart_Comp.html'));
});

app.get('/scatter_plot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scatter_plot.html'));
});

app.get('/Real_time_data_stream', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Real_time_data_stream.html'));
  });
// Add more routes as needed

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
