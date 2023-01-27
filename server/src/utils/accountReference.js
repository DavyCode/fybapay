import crypto from 'crypto';

export default async () => {
  const hash = crypto.randomBytes(256);
  const randomChar = await crypto.createHmac('sha256', hash).digest('hex');
  let ref = 'Fb|rsvd|';

  for (let i = 0; i < 15; i++) {
    const a = randomChar.charAt(Math.floor(Math.random() * randomChar.length));
    const b = randomChar.charAt(Math.floor(Math.random() * randomChar.length));
    ref += a + b;
  }
  return ref;
};
