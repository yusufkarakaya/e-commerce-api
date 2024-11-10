const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendVerificationEmail = async (userEmail, verificationCode) => {
  const msg = {
    to: userEmail,
    from: 'yusufkarakaya92@gmail.com',
    subject: 'Verification Code',
    text: `Your verification code is: ${verificationCode}`,
  }

  try {
    await sgMail.send(msg)
    console.log('Verification email sent')
  } catch (error) {
    console.error(
      'Error sending email:',
      error.response ? error.response.body.errors : error.message
    )
  }
}

module.exports = { sendVerificationEmail }
