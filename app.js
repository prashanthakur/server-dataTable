const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const pdfkit = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Word = require('./models/Word');
const mongoose = require('mongoose')
const PORT = 4000 || process.env.PORT
require('dotenv').config()

app.use(cors());
app.use(bodyParser.json());

mongoose.set('strictQuery', true);
// mongoose.connect(MONGO_URL_MENTOR,{
//    useNewUrlParser:true 
// });
mongoose.connect(process.env.MONGO_URI,{
   useNewUrlParser:true 
});
const connection = mongoose.connection;

connection.once('open',function(){
    console.log("Connection Established !"); 
})

app.get('/words',async(req,res)=>{
  const records = await Word.find()
  res.status(200).send(records)
})

app.post('/api/generate-pdf', (req, res) => {
  const selectionData = req.body;

  // Create a PDF document
  const doc = new pdfkit();
  const pdfPath = path.join(__dirname, 'generated.pdf');
  const output = fs.createWriteStream(pdfPath);
  doc.pipe(output);
  let counter = 20;
  selectionData.map((i) => {

    doc.fontSize(16).text(`${i.word} - ${i.text}`, 50, 50 + counter);
    counter = counter + 60;
  })
  doc.end();
  output.on('finish', () => {
    // Send email with the generated PDF as attachment
    sendEmail('useremail@gmail.com', pdfPath)
      .then(() => {
        console.log('Email sent successfully!');
        // Set the appropriate headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        // Stream the file to the response
        fs.createReadStream(pdfPath).pipe(res);
        // res.json({'success':"true",'msg':'email sent successfully'})
      })
      .catch((error) => {
        console.error('Email sending failed:', error);
        res.sendStatus(500);
      });
  });
});

async function sendEmail(recipient, attachmentPath) {
  const transporter = nodemailer.createTransport({
    // Configure your email transport settings here (e.g., SMTP, SendGrid, etc.)
    // See nodemailer documentation for details
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'cade67@ethereal.email',
      pass: 'aNrxSRNJSbv156ewXu'
  }
  });

  const message = {
    from: 'cade67@ethereal.email',
    to: recipient,
    subject: 'Generated PDF',
    text: 'Please find the attached PDF file.',
    attachments: [
      {
        filename: 'generated.pdf',
        path: attachmentPath,
      },
    ],
  };

  return transporter.sendMail(message);
}

app.listen(PORT, () => {
  console.log('Server is running on port 4000');
});


