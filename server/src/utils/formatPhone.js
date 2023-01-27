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
    } else if (num.startsWith('234')) {
      formatedPhone = prefix + num.slice(3);
    } else {
      formatedPhone = num;
    }

    request.body.phone = formatedPhone;
    return next();
  }
  return next();
};

export const formatNumber = (phone) => {
  if (phone) {
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
    } else if (num.startsWith('234')) {
      formatedPhone = prefix + num.slice(3);
    } else {
      formatedPhone = num;
    }

    return formatedPhone;
  }
  return false;
};

// public static boolean isValidPhone(String phone) {
//   return phone.startsWith("+234") && phone.length() > 13 
//   || phone.startsWith("234") && phone.length() > 9 
//   || phone.startsWith("070") && phone.length() > 9
//   || phone.startsWith("080") && phone.length() > 9 
//   || phone.startsWith("090") && phone.length() > 9
//   || phone.startsWith("0") && phone.length() > 9;
// }
