type HashPW = (pw: string, salt?: string | undefined) => { result: string, error: false };

const hashPW: HashPW = (pw, salt = undefined) => {

  if (salt) return {
    result: salt,
    error: false
  }

  return {
    result: pw,
    error: false
  }
}

const { result, error } = hashPW('123');