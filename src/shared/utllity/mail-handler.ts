import axios from 'axios';
import config from 'config';
import FormData from 'form-data';

export const sendEmail = async (
  to: string,
  templateName: string,
  subject: string,
  data: Record<string, any> = {},
) => {
  try {
    const form = new FormData();
    form.append('to', to);
    form.append('template', templateName);
    form.append('subject', subject);
    form.append('from', 'sandbox320e48ce0a474756b932b1958c9f3665.mailgun.org');
    Object.keys(data).forEach((key) => {
      form.append(`v:${key}`, data[key]);
    });

    const username = 'api';
    const password = config.get('emailService.privateAPIKey');
    const token = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await axios({
      method: 'post',
      url: `https://api.mailgun.net/v3/${config.get(
        'emailService.testDomain',
      )}/messages`,
      headers: {
        Authorization: `Basic ${token}`,
        contentType: 'multipart/form-data',
      },
      data: form,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};
