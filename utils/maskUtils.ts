export const maskEmail = (email: string): string => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;

  const maskedUsername = username.length > 2
    ? username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
    : username.charAt(0) + '*';

  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;

  const visibleDigits = 2;
  const maskedPart = '*'.repeat(cleaned.length - visibleDigits * 2);
  return cleaned.substring(0, visibleDigits) + maskedPart + cleaned.substring(cleaned.length - visibleDigits);
};

export const maskUsername = (username: string): string => {
  if (!username) return '';
  if (username.length <= 2) return username.charAt(0) + '*';

  return username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
};
export const maskDesc = (username: string): string => {
  if (!username) return '';
  if (username.length <= 2) {
    return username;
  }

  const start = username.slice(0, 2); // first 2 characters
  const end = username.slice(-2); // last 2 characters
  const middle = '*'.repeat(username.length - 4); // stars for the middle part

  return start + middle + end;
};

export const encryptPassword = (password: string): string => {
  return '*'.repeat(password.length);
};