export function generateVerificationCode() {
  let code = "";

  for (let i = 0; i < 5; i++) {
    code = code + Math.floor(Math.random() * 10);
  }

  return code;
}
