export default (request, response, next) => {
  if (request.body && request.body.phone) {
    const { phone } = request.body;
    const prefix = '+234';
    const num = phone.toString().replace(/\s+/, '');
    let formatedPhone;

    if (num.length <= 10 && num.startsWith('0')) {
      formatedPhone = prefix + num.slice(1);
    } else if (num.length <= 10) {
      formatedPhone = prefix + num;
    } else if (num.startsWith('0')) {
      formatedPhone = prefix + num.slice(1);
    } else if (num.startsWith('+234')) {
      formatedPhone = prefix + num.slice(4);
    } else {
      formatedPhone = num;
    }

    request.body.phone = formatedPhone;
    return next();
  }
  return next();
};
