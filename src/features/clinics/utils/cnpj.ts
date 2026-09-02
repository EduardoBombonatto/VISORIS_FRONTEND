function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isCnpjValid(raw: string): boolean {
  const digits = onlyDigits(raw);

  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const digitAt = (index: number): number => Number(digits[index]);

  const checkDigit = (length: number): number => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i += 1) {
      sum += digitAt(i) * weight;
      weight -= 1;
      if (weight < 2) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return checkDigit(12) === digitAt(12) && checkDigit(13) === digitAt(13);
}
