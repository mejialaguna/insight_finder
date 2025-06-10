export const initialsExtractor = (fullName: string) => {
  return fullName
    .split(' ')
    .map((word) => word.slice(0, 1))
    .join('')
    .toUpperCase();
};
